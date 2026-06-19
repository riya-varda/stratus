import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class DeploymentCreate(BaseModel):
    environment: str = Field(default="development", pattern=r"^(development|staging|production)$")
    commit_sha: Optional[str] = Field(None, max_length=40)
    commit_message: Optional[str] = None
    branch: Optional[str] = Field(None, max_length=255)
    metadata: Optional[Dict[str, Any]] = None


class DeploymentUpdate(BaseModel):
    status: Optional[str] = None
    deployment_url: Optional[str] = None
    build_logs: Optional[str] = None
    error_message: Optional[str] = None
    build_duration_seconds: Optional[int] = None


class DeploymentResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    created_by_id: Optional[uuid.UUID]
    environment: str
    status: str
    commit_sha: Optional[str]
    commit_message: Optional[str]
    branch: Optional[str]
    deployment_url: Optional[str]
    build_logs: Optional[str]
    error_message: Optional[str]
    metadata: Optional[Dict[str, Any]]
    build_duration_seconds: Optional[int]
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DeploymentListResponse(BaseModel):
    items: list[DeploymentResponse]
    total: int
    page: int
    page_size: int
    pages: int
