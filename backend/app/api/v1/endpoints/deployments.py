import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_pagination_params
from app.db.session import get_db
from app.models.models import DeploymentStatus, User
from app.schemas.deployment import DeploymentCreate, DeploymentListResponse, DeploymentResponse
from app.services.deployment_service import DeploymentService
from app.services.project_service import ProjectService
from app.tasks.tasks import process_deployment

router = APIRouter()


async def get_project_or_404(project_id: uuid.UUID, current_user: User, db: AsyncSession):
    project_service = ProjectService(db)
    project = await project_service.get_by_id(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/projects/{project_id}/deployments", response_model=DeploymentListResponse)
async def list_deployments(
    project_id: uuid.UUID,
    pagination: dict = Depends(get_pagination_params),
    environment: str | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await get_project_or_404(project_id, current_user, db)
    service = DeploymentService(db)
    return await service.list_deployments(
        project_id=project_id,
        page=pagination["page"],
        page_size=pagination["page_size"],
        search=pagination["search"],
        sort_by=pagination["sort_by"] or "created_at",
        sort_order=pagination["sort_order"],
        environment=environment,
        status=status,
    )


@router.post(
    "/projects/{project_id}/deployments",
    response_model=DeploymentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_deployment(
    project_id: uuid.UUID,
    deployment_in: DeploymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await get_project_or_404(project_id, current_user, db)
    service = DeploymentService(db)
    deployment = await service.create(project_id, current_user.id, deployment_in)
    process_deployment.delay(str(deployment.id), str(project_id))
    return deployment


@router.get("/projects/{project_id}/deployments/stats")
async def get_deployment_stats(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await get_project_or_404(project_id, current_user, db)
    service = DeploymentService(db)
    return await service.get_stats(project_id)


@router.get("/projects/{project_id}/deployments/{deployment_id}", response_model=DeploymentResponse)
async def get_deployment(
    project_id: uuid.UUID,
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await get_project_or_404(project_id, current_user, db)
    service = DeploymentService(db)
    deployment = await service.get_by_id(deployment_id, project_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return deployment


@router.post(
    "/projects/{project_id}/deployments/{deployment_id}/cancel", response_model=DeploymentResponse
)
async def cancel_deployment(
    project_id: uuid.UUID,
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await get_project_or_404(project_id, current_user, db)
    service = DeploymentService(db)
    deployment = await service.get_by_id(deployment_id, project_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    if deployment.status not in (DeploymentStatus.pending, DeploymentStatus.building):
        raise HTTPException(status_code=400, detail="Deployment cannot be cancelled")
    return await service.update_status(deployment, DeploymentStatus.cancelled)
