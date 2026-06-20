import logging
import math
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.redis import cache_delete_pattern
from app.models.models import Deployment, DeploymentStatus
from app.schemas.deployment import DeploymentCreate

logger = logging.getLogger(__name__)


class DeploymentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, deployment_id: uuid.UUID, project_id: uuid.UUID) -> Deployment | None:
        result = await self.db.execute(
            select(Deployment).where(
                Deployment.id == deployment_id,
                Deployment.project_id == project_id,
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self, project_id: uuid.UUID, created_by_id: uuid.UUID, deployment_in: DeploymentCreate
    ) -> Deployment:
        deployment = Deployment(
            project_id=project_id,
            created_by_id=created_by_id,
            environment=deployment_in.environment,
            commit_sha=deployment_in.commit_sha,
            commit_message=deployment_in.commit_message,
            branch=deployment_in.branch or "main",
            deployment_metadata=deployment_in.metadata or {},
            status=DeploymentStatus.pending,
            started_at=datetime.now(UTC),
        )
        self.db.add(deployment)
        await self.db.flush()
        await self.db.refresh(deployment)
        await cache_delete_pattern(f"deployments:{project_id}:*")
        return deployment

    async def update_status(
        self, deployment: Deployment, status: DeploymentStatus, **kwargs
    ) -> Deployment:
        deployment.status = status
        for key, value in kwargs.items():
            if hasattr(deployment, key):
                setattr(deployment, key, value)
        if status in (
            DeploymentStatus.success,
            DeploymentStatus.failed,
            DeploymentStatus.cancelled,
        ):
            deployment.finished_at = datetime.now(UTC)
            if deployment.started_at:
                delta = deployment.finished_at - deployment.started_at
                deployment.build_duration_seconds = int(delta.total_seconds())
        await self.db.flush()
        await self.db.refresh(deployment)
        await cache_delete_pattern(f"deployments:{deployment.project_id}:*")
        return deployment

    async def list_deployments(
        self,
        project_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        environment: str | None = None,
        status: str | None = None,
    ) -> dict[str, Any]:
        query = select(Deployment).where(Deployment.project_id == project_id)

        if search:
            query = query.where(
                or_(
                    Deployment.commit_sha.ilike(f"%{search}%"),
                    Deployment.commit_message.ilike(f"%{search}%"),
                    Deployment.branch.ilike(f"%{search}%"),
                )
            )

        if environment:
            query = query.where(Deployment.environment == environment)

        if status:
            query = query.where(Deployment.status == status)

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        sort_col = getattr(Deployment, sort_by, Deployment.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = await self.db.execute(query)
        items = result.scalars().all()

        return {
            "items": list(items),
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": math.ceil(total / page_size) if total else 0,
        }

    async def get_stats(self, project_id: uuid.UUID) -> dict[str, Any]:
        result = await self.db.execute(
            select(
                func.count(Deployment.id).label("total"),
                func.count(Deployment.id)
                .filter(Deployment.status == DeploymentStatus.success)
                .label("success"),
                func.count(Deployment.id)
                .filter(Deployment.status == DeploymentStatus.failed)
                .label("failed"),
                func.avg(Deployment.build_duration_seconds).label("avg_duration"),
            ).where(Deployment.project_id == project_id)
        )
        row = result.first()
        return {
            "total": row.total or 0,
            "success": row.success or 0,
            "failed": row.failed or 0,
            "avg_duration_seconds": float(row.avg_duration) if row.avg_duration else 0,
            "success_rate": (row.success / row.total * 100) if row.total else 0,
        }
