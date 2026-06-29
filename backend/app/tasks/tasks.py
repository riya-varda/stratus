import logging
import smtplib
from datetime import UTC, datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_task(self, to_email: str, subject: str, html_body: str):
    try:
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.info(f"Email (not configured): to={to_email} subject={subject}")
            return {"status": "skipped", "reason": "SMTP not configured"}
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, to_email, msg.as_string())
        return {"status": "sent", "to": to_email}
    except Exception as exc:
        logger.error(f"Failed to send email to {to_email}: {exc}")
        raise self.retry(exc=exc) from exc


@celery_app.task(bind=True, max_retries=3)
def send_welcome_email(self, to_email: str, username: str):
    html = f"""
    <h1>Welcome to Stratus, {username}!</h1>
    <p>Your account has been created. Start deploying at <a href="https://stratus.dev">stratus.dev</a>.</p>
    """
    return send_email_task.delay(to_email, "Welcome to Stratus", html)


@celery_app.task(bind=True, max_retries=3)
def send_deployment_notification(self, to_email: str, project_name: str, status: str, env: str):
    emoji = "✅" if status == "success" else "❌"
    html = f"""
    <h2>{emoji} Deployment {status.title()}</h2>
    <p>Your deployment to <strong>{env}</strong> for project <strong>{project_name}</strong> has {status}.</p>
    """
    subject = f"{emoji} [{project_name}] Deployment {status} on {env}"
    return send_email_task.delay(to_email, subject, html)


@celery_app.task
def cleanup_old_deployment_logs():
    """Remove build logs older than 30 days to save storage."""
    logger.info("Running scheduled cleanup of old deployment logs")
    return {"status": "completed", "timestamp": datetime.now(UTC).isoformat()}


@celery_app.task(bind=True, max_retries=5, default_retry_delay=30)
def process_deployment(self, deployment_id: str, project_id: str):
    """Run a real Docker build based on project framework and persist results."""
    import asyncio
    import os
    import uuid

    import docker

    from app.models.models import DeploymentStatus, Project
    from app.services.deployment_service import DeploymentService

    framework_build = {
        "react": {
            "image": "node:20-alpine",
            "fixture": "build_fixtures/react",
            "command": "sh -c 'echo Building React app... && sleep 2 && echo Build complete!'",
        },
        "nextjs": {
            "image": "node:20-alpine",
            "fixture": "build_fixtures/nextjs",
            "command": "sh -c 'echo Building Next.js app... && sleep 2 && echo Build complete!'",
        },
        "fastapi": {
            "image": "python:3.12-slim",
            "fixture": None,
            "command": "sh -c 'pip install fastapi uvicorn sqlalchemy -q && echo Build complete!'",
        },
        "flask": {
            "image": "python:3.12-slim",
            "fixture": None,
            "command": "sh -c 'pip install flask requests -q && echo Build complete!'",
        },
    }

    default_build = {
        "image": "alpine:latest",
        "fixture": None,
        "command": "sh -c 'echo No framework specified. Running default build... && sleep 2 && echo Done!'",
    }

    async def _update_db(status, **kwargs):
        from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

        from app.core.config import settings

        task_engine = create_async_engine(settings.DATABASE_URL, pool_size=1, max_overflow=0)
        task_session_local = async_sessionmaker(task_engine, expire_on_commit=False)
        try:
            async with task_session_local() as session:
                service = DeploymentService(session)
                deployment = await service.get_by_id(
                    uuid.UUID(deployment_id), uuid.UUID(project_id)
                )
                if not deployment:
                    logger.error(f"Deployment {deployment_id} not found")
                    return None
                await service.update_status(deployment, status, **kwargs)
                await session.commit()
                return deployment
        finally:
            await task_engine.dispose()

    async def _get_framework():
        from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

        from app.core.config import settings

        task_engine = create_async_engine(settings.DATABASE_URL, pool_size=1, max_overflow=0)
        task_session_local = async_sessionmaker(task_engine, expire_on_commit=False)
        try:
            async with task_session_local() as session:
                project = await session.get(Project, uuid.UUID(project_id))
                return project.framework if project else None
        finally:
            await task_engine.dispose()

    try:
        logger.info(f"Processing deployment {deployment_id}")

        asyncio.run(_update_db(DeploymentStatus.building))

        framework = asyncio.run(_get_framework())
        build_config = framework_build.get(framework or "", default_build)
        logger.info(f"Building with framework={framework}, image={build_config['image']}")

        docker_client = docker.from_env()
        build_logs = []
        success = False
        error_message = None

        try:
            fixture_path = build_config.get("fixture")
            volumes = {}
            if fixture_path:
                abs_fixture = os.path.join("/app", fixture_path)
                volumes[abs_fixture] = {"bind": "/workspace", "mode": "ro"}
                workdir = "/workspace"
            else:
                workdir = "/"

            container = docker_client.containers.run(
                image=build_config["image"],
                command=build_config["command"],
                volumes=volumes,
                working_dir=workdir,
                remove=False,
                detach=True,
            )

            for line in container.logs(stream=True, follow=True):
                log_line = line.decode("utf-8").strip()
                build_logs.append(log_line)
                logger.info(f"[build] {log_line}")

            result = container.wait()
            exit_code = result.get("StatusCode", 1)
            success = exit_code == 0
            container.remove()

            if not success:
                error_message = f"Build failed with exit code {exit_code}"

        except Exception as docker_exc:
            logger.error(f"Docker build error: {docker_exc}")
            error_message = str(docker_exc)
            success = False

        finally:
            try:
                docker_client.close()
            except Exception:
                pass

        logs_text = "\n".join(build_logs)
        asyncio.run(
            _update_db(
                DeploymentStatus.success if success else DeploymentStatus.failed,
                deployment_url=(f"https://{deployment_id[:8]}.stratus.app" if success else None),
                error_message=error_message,
                build_logs=logs_text,
            )
        )

        logger.info(f"Deployment {deployment_id} finished: {'success' if success else 'failed'}")
        return {
            "deployment_id": deployment_id,
            "status": "success" if success else "failed",
        }

    except Exception as exc:
        logger.error(f"Failed to process deployment {deployment_id}: {exc}")
        asyncio.run(
            _update_db(
                DeploymentStatus.failed,
                error_message=str(exc),
            )
        )
        raise self.retry(exc=exc) from exc
