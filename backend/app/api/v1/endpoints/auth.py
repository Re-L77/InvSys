from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
def me(db: Session = Depends(get_db)) -> dict[str, str]:
    """Returns the current identity seen by the API and the database session."""
    try:
        row = db.execute(
            text("SELECT CURRENT_USER() AS db_current_user_name, USER() AS db_session_user_name")
        ).mappings().one()
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {exc}") from exc

    parsed = urlparse(settings.database_url)
    configured_user = parsed.username or "unknown"

    return {
        "app_user": "anonymous",
        "db_config_user": configured_user,
        "db_current_user": str(row["db_current_user_name"]),
        "db_session_user": str(row["db_session_user_name"]),
    }
