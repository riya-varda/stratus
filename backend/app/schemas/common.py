from typing import Any

from pydantic import BaseModel


class MessageResponse(BaseModel):
    message: str
    detail: Any | None = None


class ErrorResponse(BaseModel):
    error: str
    detail: Any | None = None
    code: str | None = None


class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20
    search: str | None = None
    sort_by: str | None = None
    sort_order: str = "desc"


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    database: str
    redis: str
    timestamp: str
