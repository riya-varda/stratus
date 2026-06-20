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
    # In a real app, you'd connect to DB here and clear old logs
    return {"status": "completed", "timestamp": datetime.now(UTC).isoformat()}


@celery_app.task(bind=True, max_retries=5, default_retry_delay=30)
def process_deployment(self, deployment_id: str, project_id: str):
    """Simulate deployment processing."""
    import random
    import time

    try:
        logger.info(f"Processing deployment {deployment_id}")
        time.sleep(random.uniform(5, 15))  # simulate build
        success = random.random() > 0.1  # 90% success rate
        return {
            "deployment_id": deployment_id,
            "status": "success" if success else "failed",
            "duration_seconds": random.randint(30, 300),
        }
    except Exception as exc:
        raise self.retry(exc=exc) from exc
