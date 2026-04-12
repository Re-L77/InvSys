from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.engine import make_url

from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

ROLE_MAP: dict[str, tuple[str, str]] = {
    "admin_role": ("admin", "Administrador"),
    "almacenista_role": ("almacenista", "Almacenista"),
    "supervisor_role": ("supervisor", "Supervisor"),
}


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str = Field(alias="refreshToken")
    model_config = ConfigDict(populate_by_name=True)


class UserRead(BaseModel):
    username: str
    role: str
    display_name: str = Field(alias="displayName")

    model_config = ConfigDict(populate_by_name=True)


class AuthResponse(BaseModel):
    access_token: str = Field(alias="accessToken")
    refresh_token: str = Field(alias="refreshToken")
    token_type: str = Field(alias="tokenType")
    user: UserRead

    model_config = ConfigDict(populate_by_name=True)


ACCESS_TOKEN_SECONDS = int(settings.auth_access_token_minutes) * 60
REFRESH_TOKEN_SECONDS = int(settings.auth_refresh_token_days) * 24 * 60 * 60


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64decode(token_part: str) -> bytes:
    padding = "=" * (-len(token_part) % 4)
    return base64.urlsafe_b64decode((token_part + padding).encode("ascii"))


def _sign(payload: bytes) -> bytes:
    return hmac.new(settings.auth_secret_key.encode("utf-8"), payload, hashlib.sha256).digest()


def _encode_token(claims: dict[str, Any]) -> str:
    payload = json.dumps(claims, separators=(",", ":"), sort_keys=True).encode("utf-8")
    signature = _sign(payload)
    return f"{_b64encode(payload)}.{_b64encode(signature)}"


def _decode_token(token: str) -> dict[str, Any]:
    try:
        payload_part, signature_part = token.split(".", 1)
        payload = _b64decode(payload_part)
        signature = _b64decode(signature_part)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    expected_signature = _sign(payload)
    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token signature")

    try:
        claims = json.loads(payload.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload") from exc

    exp = claims.get("exp")
    if not isinstance(exp, int) or exp < int(time.time()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    return claims


def _strip_quotes(value: str) -> str:
    return value.strip().strip("'")


def _app_role_from_db_role(db_role: str | None, username: str) -> tuple[str, str]:
    normalized_role = _strip_quotes(db_role or "").split(",", 1)[0].strip()
    if normalized_role in ROLE_MAP:
        return ROLE_MAP[normalized_role]

    normalized_username = username.split("@", 1)[0]
    for role_name, identity in ROLE_MAP.items():
        if normalized_username.startswith(identity[0]):
            return identity

    return "unknown", normalized_username.replace("_", " ").title() or "Usuario"


def _build_user_read(username: str, role: str, display_name: str) -> UserRead:
    return UserRead(username=username, role=role, displayName=display_name)


def _issue_tokens(user: UserRead) -> AuthResponse:
    now = int(datetime.now(timezone.utc).timestamp())
    common_claims = {
        "sub": user.username,
        "role": user.role,
        "display_name": user.display_name,
        "iat": now,
        "jti": secrets.token_urlsafe(12),
    }
    access_claims = {
        **common_claims,
        "token_type": "access",
        "exp": now + ACCESS_TOKEN_SECONDS,
    }
    refresh_claims = {
        **common_claims,
        "token_type": "refresh",
        "exp": now + REFRESH_TOKEN_SECONDS,
    }
    return AuthResponse(
        accessToken=_encode_token(access_claims),
        refreshToken=_encode_token(refresh_claims),
        tokenType="bearer",
        user=user,
    )


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")
    return token.strip()


def _resolve_user_from_token(token: str, expected_token_type: str) -> UserRead:
    claims = _decode_token(token)
    token_type = claims.get("token_type")
    if token_type != expected_token_type:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    username = str(claims.get("sub") or "")
    role = str(claims.get("role") or "unknown")
    display_name = str(claims.get("display_name") or username)
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    return _build_user_read(username=username, role=role, display_name=display_name)


def require_access_user(authorization: str | None = Header(default=None)) -> UserRead:
    token = _extract_bearer_token(authorization)
    return _resolve_user_from_token(token, "access")


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    base_url = make_url(settings.database_url)
    login_url = base_url.set(username=payload.username, password=payload.password)
    engine = create_engine(login_url, pool_pre_ping=True)

    try:
        with engine.connect() as connection:
            row = connection.execute(
                text("SELECT CURRENT_USER() AS current_user_name, CURRENT_ROLE() AS current_role_name")
            ).mappings().one()
    except OperationalError as exc:
        error_code = getattr(exc.orig, "args", [None])[0]
        if error_code == 1045:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales invalidas") from exc
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Database unavailable: {exc}") from exc
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Database unavailable: {exc}") from exc
    finally:
        engine.dispose()

    db_username = str(row["current_user_name"]).split("@", 1)[0]
    role, display_name = _app_role_from_db_role(str(row["current_role_name"]), str(row["current_user_name"]))
    user = _build_user_read(username=db_username, role=role, display_name=display_name)
    return _issue_tokens(user)


@router.post("/refresh", response_model=AuthResponse)
def refresh(payload: RefreshRequest) -> AuthResponse:
    user = _resolve_user_from_token(payload.refresh_token, "refresh")
    return _issue_tokens(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout() -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserRead)
def me(authorization: str | None = Header(default=None)) -> UserRead:
    return require_access_user(authorization)
