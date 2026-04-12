"""
Shared models and utilities for standardized API responses and error handling.
"""

from typing import Any

from fastapi import HTTPException, status
from pydantic import BaseModel, ConfigDict, Field


class ErrorDetail(BaseModel):
    """Standard error response format."""
    code: str = Field(..., description="Error code for client handling")
    detail: str = Field(..., description="Human-readable error message")
    model_config = ConfigDict(populate_by_name=True)


class ErrorResponse(BaseModel):
    """API error response wrapper."""
    error: ErrorDetail
    model_config = ConfigDict(populate_by_name=True)


def raise_bad_request(code: str, detail: str) -> None:
    """Raise 400 Bad Request with standard format."""
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={"code": code, "detail": detail}
    )


def raise_conflict(code: str, detail: str) -> None:
    """Raise 409 Conflict with standard format."""
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={"code": code, "detail": detail}
    )


def raise_not_found(entity: str) -> None:
    """Raise 404 Not Found with standard format."""
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "detail": f"{entity} not found"}
    )


def raise_unprocessable(code: str, detail: str) -> None:
    """Raise 422 Unprocessable Entity with standard format."""
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail={"code": code, "detail": detail}
    )
