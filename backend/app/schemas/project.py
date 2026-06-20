import re
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    repository_url: str | None = None
    framework: str | None = None
    settings: dict[str, Any] | None = None

    @field_validator("name")
    @classmethod
    def generate_slug(cls, v: str) -> str:
        return v

    def get_slug(self) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", self.name.lower()).strip("-")
        return slug[:255]


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    repository_url: str | None = None
    framework: str | None = None
    settings: dict[str, Any] | None = None
    status: str | None = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    slug: str
    description: str | None
    status: str
    repository_url: str | None
    framework: str | None
    settings: dict[str, Any] | None
    deployment_count: int | None = 0
    last_deployed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
    page: int
    page_size: int
    pages: int
