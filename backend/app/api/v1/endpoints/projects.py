import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.dependencies import get_current_active_user, get_pagination_params
from app.db.session import get_db
from app.models.models import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse
from app.schemas.common import MessageResponse
from app.services.project_service import ProjectService

router = APIRouter()


@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    pagination: dict = Depends(get_pagination_params),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = ProjectService(db)
    result = await service.list_projects(
        owner_id=current_user.id,
        page=pagination["page"],
        page_size=pagination["page_size"],
        search=pagination["search"],
        sort_by=pagination["sort_by"] or "created_at",
        sort_order=pagination["sort_order"],
        status=status,
    )
    return result


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = ProjectService(db)
    project = await service.create(owner_id=current_user.id, project_in=project_in)
    return {
        "id": project.id,
        "owner_id": project.owner_id,
        "name": project.name,
        "slug": project.slug,
        "description": project.description,
        "status": project.status,
        "repository_url": project.repository_url,
        "framework": project.framework,
        "settings": project.settings,
        "deployment_count": 0,
        "last_deployed_at": None,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = ProjectService(db)
    project = await service.get_by_id(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "id": project.id,
        "owner_id": project.owner_id,
        "name": project.name,
        "slug": project.slug,
        "description": project.description,
        "status": project.status,
        "repository_url": project.repository_url,
        "framework": project.framework,
        "settings": project.settings,
        "deployment_count": 0,
        "last_deployed_at": None,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    update_data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = ProjectService(db)
    project = await service.get_by_id(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    updated = await service.update(project, update_data)
    return {
        "id": updated.id,
        "owner_id": updated.owner_id,
        "name": updated.name,
        "slug": updated.slug,
        "description": updated.description,
        "status": updated.status,
        "repository_url": updated.repository_url,
        "framework": updated.framework,
        "settings": updated.settings,
        "deployment_count": 0,
        "last_deployed_at": None,
        "created_at": updated.created_at,
        "updated_at": updated.updated_at,
    }


@router.delete("/{project_id}", response_model=MessageResponse)
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = ProjectService(db)
    project = await service.get_by_id(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await service.delete(project)
    return MessageResponse(message="Project deleted")
