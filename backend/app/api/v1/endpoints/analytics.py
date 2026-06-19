from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime, timezone, timedelta

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.models import User, Project, Deployment, DeploymentStatus, ProjectStatus

router = APIRouter()


@router.get("/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    # Project stats
    total_projects = await db.execute(
        select(func.count(Project.id)).where(
            Project.owner_id == current_user.id,
            Project.status != ProjectStatus.deleted,
        )
    )

    # Deployment stats
    total_deployments = await db.execute(
        select(func.count(Deployment.id))
        .join(Project)
        .where(Project.owner_id == current_user.id)
    )

    success_deployments = await db.execute(
        select(func.count(Deployment.id))
        .join(Project)
        .where(
            Project.owner_id == current_user.id,
            Deployment.status == DeploymentStatus.success,
        )
    )

    recent_deployments = await db.execute(
        select(func.count(Deployment.id))
        .join(Project)
        .where(
            Project.owner_id == current_user.id,
            Deployment.created_at >= thirty_days_ago,
        )
    )

    # Recent activity
    activity_result = await db.execute(
        select(Deployment, Project.name.label("project_name"))
        .join(Project)
        .where(Project.owner_id == current_user.id)
        .order_by(desc(Deployment.created_at))
        .limit(10)
    )
    activities = activity_result.all()

    # Deployment trend (last 14 days)
    trend = []
    for i in range(13, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = await db.execute(
            select(func.count(Deployment.id))
            .join(Project)
            .where(
                Project.owner_id == current_user.id,
                Deployment.created_at >= day_start,
                Deployment.created_at < day_end,
            )
        )
        trend.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "deployments": count.scalar_one(),
        })

    total_deps = total_deployments.scalar_one()
    success_deps = success_deployments.scalar_one()

    return {
        "projects": {
            "total": total_projects.scalar_one(),
        },
        "deployments": {
            "total": total_deps,
            "success": success_deps,
            "failed": total_deps - success_deps,
            "recent_30d": recent_deployments.scalar_one(),
            "success_rate": round((success_deps / total_deps * 100) if total_deps else 0, 1),
        },
        "trend": trend,
        "recent_activity": [
            {
                "id": str(a.Deployment.id),
                "project_name": a.project_name,
                "status": a.Deployment.status,
                "environment": a.Deployment.environment,
                "branch": a.Deployment.branch,
                "commit_message": a.Deployment.commit_message,
                "created_at": a.Deployment.created_at.isoformat() if a.Deployment.created_at else None,
            }
            for a in activities
        ],
    }
