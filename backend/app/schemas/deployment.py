import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DeploymentCreate(BaseModel):
    environment: str = Field(default="development", pattern=r"^(development|staging|production)$")
    commit_sha: str | None = Field(None, max_length=40)
    commit_message: str | None = None
    branch: str | None = Field(None, max_length=255)
    metadata: dict[str, Any] | None = None


class DeploymentUpdate(BaseModel):
    status: str | None = None
    deployment_url: str | None = None
    build_logs: str | None = None
    error_message: str | None = None
    build_duration_seconds: int | None = None


class DeploymentResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    created_by_id: uuid.UUID | None
    environment: str
    status: str
    commit_sha: str | None
    commit_message: str | None
    branch: str | None
    deployment_url: str | None
    build_logs: str | None
    error_message: str | None
    deployment_metadata: dict[str, Any] | None = Field(None, serialization_alias="metadata")
    build_duration_seconds: int | None
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DeploymentListResponse(BaseModel):
    items: list[DeploymentResponse]
    total: int
    page: int
    page_size: int
    pages: int
