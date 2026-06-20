import logging
import math
import re
import uuid
from typing import Any

from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.redis import cache_delete, cache_delete_pattern, cache_get, cache_set
from app.models.models import Deployment, Project, ProjectStatus
from app.schemas.project import ProjectCreate, ProjectUpdate

logger = logging.getLogger(__name__)


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:255]


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, project_id: uuid.UUID, owner_id: uuid.UUID) -> Project | None:
        result = await self.db.execute(
            select(Project).where(Project.id == project_id, Project.owner_id == owner_id)
        )
        return result.scalar_one_or_none()

    async def create(self, owner_id: uuid.UUID, project_in: ProjectCreate) -> Project:
        slug = slugify(project_in.name)

        # Ensure unique slug
        existing = await self.db.execute(
            select(Project).where(Project.owner_id == owner_id, Project.slug == slug)
        )
        if existing.scalar_one_or_none():
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        project = Project(
            owner_id=owner_id,
            name=project_in.name,
            slug=slug,
            description=project_in.description,
            repository_url=project_in.repository_url,
            framework=project_in.framework,
            settings=project_in.settings or {},
        )
        self.db.add(project)
        await self.db.flush()
        await self.db.refresh(project)
        await cache_delete_pattern(f"projects:{owner_id}:*")
        return project

    async def update(self, project: Project, update_data: ProjectUpdate) -> Project:
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(project, field, value)
        await self.db.flush()
        await self.db.refresh(project)
        await cache_delete(f"project:{project.id}")
        await cache_delete_pattern(f"projects:{project.owner_id}:*")
        return project

    async def delete(self, project: Project) -> None:
        project.status = ProjectStatus.deleted
        await self.db.flush()
        await cache_delete(f"project:{project.id}")
        await cache_delete_pattern(f"projects:{project.owner_id}:*")

    async def list_projects(
        self,
        owner_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        status: str | None = None,
    ) -> dict[str, Any]:
        cache_key = (
            f"projects:{owner_id}:{page}:{page_size}:{search}:{sort_by}:{sort_order}:{status}"
        )
        cached = await cache_get(cache_key)
        if cached:
            return cached

        query = select(Project).where(
            Project.owner_id == owner_id,
            Project.status != ProjectStatus.deleted,
        )

        if search:
            query = query.where(
                or_(
                    Project.name.ilike(f"%{search}%"),
                    Project.description.ilike(f"%{search}%"),
                )
            )

        if status:
            query = query.where(Project.status == status)

        # Count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        # Sort
        sort_col = getattr(Project, sort_by, Project.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        # Paginate
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = await self.db.execute(query)
        projects = result.scalars().all()

        # Enrich with deployment info
        enriched = []
        for p in projects:
            dep_count = await self.db.execute(
                select(func.count(Deployment.id)).where(Deployment.project_id == p.id)
            )
            last_dep = await self.db.execute(
                select(Deployment.created_at)
                .where(Deployment.project_id == p.id)
                .order_by(desc(Deployment.created_at))
                .limit(1)
            )
            p_dict = {
                "id": p.id,
                "owner_id": p.owner_id,
                "name": p.name,
                "slug": p.slug,
                "description": p.description,
                "status": p.status,
                "repository_url": p.repository_url,
                "framework": p.framework,
                "settings": p.settings,
                "deployment_count": dep_count.scalar_one(),
                "last_deployed_at": last_dep.scalar_one_or_none(),
                "created_at": p.created_at,
                "updated_at": p.updated_at,
            }
            enriched.append(p_dict)

        result_data = {
            "items": enriched,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": math.ceil(total / page_size) if total else 0,
        }
        await cache_set(cache_key, result_data, ttl=60)
        return result_data
