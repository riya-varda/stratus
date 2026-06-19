import uuid
import re
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    repository_url: Optional[str] = None
    framework: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

    @field_validator("name")
    @classmethod
    def generate_slug(cls, v: str) -> str:
        return v

    def get_slug(self) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", self.name.lower()).strip("-")
        return slug[:255]


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    repository_url: Optional[str] = None
    framework: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    status: Optional[str] = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    slug: str
    description: Optional[str]
    status: str
    repository_url: Optional[str]
    framework: Optional[str]
    settings: Optional[Dict[str, Any]]
    deployment_count: Optional[int] = 0
    last_deployed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
    page: int
    page_size: int
    pages: int
