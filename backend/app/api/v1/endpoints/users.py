from __future__ import annotations

import re
from collections import defaultdict
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import require_access_user, require_roles
from app.db.session import get_db

router = APIRouter(prefix="/users", tags=["users"])

APP_ROLE_TO_DB_ROLE = {
    "admin": "admin_role",
    "almacenista": "almacenista_role",
    "supervisor": "supervisor_role",
}

DB_ROLE_TO_APP_ROLE = {value: key for key, value in APP_ROLE_TO_DB_ROLE.items()}
ROLE_DISPLAY_NAMES = {
    "admin": "Administrador",
    "almacenista": "Almacenista",
    "supervisor": "Supervisor",
}
SYSTEM_USERS = {"PUBLIC", "root", "mysql", "mysql.session", "mysql.sys", "mariadb.sys"}
ACCOUNT_HOSTS = ("localhost", "10.0.2.2", "%")
USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_.-]{3,50}$")


class UserRead(BaseModel):
    username: str
    role: str
    display_name: str = Field(alias="displayName")
    model_config = ConfigDict(populate_by_name=True)


class UserCreateRequest(BaseModel):
    username: str
    password: str
    role: str
    display_name: str | None = Field(default=None, alias="displayName")
    model_config = ConfigDict(populate_by_name=True)


class UserUpdateRequest(BaseModel):
    display_name: str = Field(alias="displayName")
    model_config = ConfigDict(populate_by_name=True)


class UserPasswordUpdateRequest(BaseModel):
    new_password: str = Field(alias="newPassword")
    model_config = ConfigDict(populate_by_name=True)


class UserRoleUpdateRequest(BaseModel):
    role: str


def _handle_sql_error(exc: SQLAlchemyError) -> None:
    if isinstance(exc, IntegrityError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Database constraint violation") from exc
    if isinstance(exc, OperationalError):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Database unavailable: {exc}") from exc
    raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Database unavailable: {exc}") from exc


def _validate_username(username: str) -> str:
    if not USERNAME_PATTERN.fullmatch(username):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="username must be 3-50 chars and contain only letters, numbers, underscore, dot or hyphen",
        )
    return username


def _validate_password(password: str) -> str:
    if len(password) < 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="password is too short")
    if len(password) > 128:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="password is too long")
    return password


def _validate_role(role: str) -> str:
    if role not in APP_ROLE_TO_DB_ROLE:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="invalid role")
    return role


def _quote_sql(value: str) -> str:
    return value.replace("'", "''")


def _account_spec(username: str, host: str) -> str:
    return f"'{_quote_sql(username)}'@'{_quote_sql(host)}'"


def _display_name_for(role: str, username: str) -> str:
    return ROLE_DISPLAY_NAMES.get(role, username.replace("_", " ").title())


def _existing_hosts(db: Session, username: str) -> list[str]:
    rows = db.execute(
        text("SELECT Host FROM mysql.user WHERE User = :username ORDER BY Host"),
        {"username": username},
    ).all()
    return [str(row[0]) for row in rows]


def _get_role_from_grants(db: Session, username: str, host: str) -> str:
    account = _account_spec(username, host)
    rows = db.execute(text(f"SHOW GRANTS FOR {account}")).all()
    for row in rows:
        grant = str(row[0])
        match = re.search(r"GRANT [`']([^`']+)[`'] TO", grant)
        if match:
            db_role = match.group(1)
            if db_role in DB_ROLE_TO_APP_ROLE:
                return DB_ROLE_TO_APP_ROLE[db_role]
    return "unknown"


def _build_user(username: str, role: str) -> UserRead:
    return UserRead(username=username, role=role, displayName=_display_name_for(role, username))


def _collect_users(db: Session) -> list[UserRead]:
    rows = db.execute(text("SELECT DISTINCT User, Host FROM mysql.user WHERE User <> '' ORDER BY User, Host")).mappings().all()
    grouped_hosts: dict[str, list[str]] = defaultdict(list)
    for row in rows:
        username = str(row["User"])
        if username in SYSTEM_USERS or username in DB_ROLE_TO_APP_ROLE or username.endswith("_role"):
            continue
        grouped_hosts[username].append(str(row["Host"]))

    users: list[UserRead] = []
    for username, hosts in grouped_hosts.items():
        role = "unknown"
        for host in hosts:
            try:
                role = _get_role_from_grants(db, username, host)
                if role != "unknown":
                    break
            except SQLAlchemyError:
                continue
        users.append(_build_user(username, role))

    users.sort(key=lambda item: item.username)
    return users


@router.get("")
def list_users(db: Session = Depends(get_db), _: UserRead = Depends(require_roles("admin"))) -> list[UserRead]:
    try:
        return _collect_users(db)
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=UserRead)
def create_user(payload: UserCreateRequest, db: Session = Depends(get_db), _: UserRead = Depends(require_roles("admin"))) -> UserRead:
    username = _validate_username(payload.username)
    password = _validate_password(payload.password)
    role = _validate_role(payload.role)
    display_name = payload.display_name or _display_name_for(role, username)

    try:
        if _existing_hosts(db, username):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

        db_role = APP_ROLE_TO_DB_ROLE[role]
        for host in ACCOUNT_HOSTS:
            account = _account_spec(username, host)
            db.execute(text(f"CREATE USER IF NOT EXISTS {account} IDENTIFIED BY :password"), {"password": password})
            db.execute(text(f"GRANT '{db_role}' TO {account}"))
            db.execute(text(f"SET DEFAULT ROLE '{db_role}' FOR {account}"))
        db.commit()
        return UserRead(username=username, role=role, displayName=display_name)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)


@router.patch("/{username}", response_model=UserRead)
def update_user(username: str, payload: UserUpdateRequest, db: Session = Depends(get_db), _: UserRead = Depends(require_roles("admin"))) -> UserRead:
    username = _validate_username(username)
    try:
        hosts = _existing_hosts(db, username)
        if not hosts:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        role = "unknown"
        for host in hosts:
            role = _get_role_from_grants(db, username, host)
            if role != "unknown":
                break
        # MariaDB no guarda display names para cuentas. Se acepta el campo para compatibilidad
        # con el contrato, pero la fuente de verdad sigue siendo el usuario/rol.
        return UserRead(username=username, role=role, displayName=payload.display_name)
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.patch("/{username}/password", status_code=status.HTTP_204_NO_CONTENT)
def update_password(username: str, payload: UserPasswordUpdateRequest, db: Session = Depends(get_db), _: UserRead = Depends(require_roles("admin"))) -> Response:
    username = _validate_username(username)
    password = _validate_password(payload.new_password)
    try:
        hosts = _existing_hosts(db, username)
        if not hosts:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        for host in hosts:
            account = _account_spec(username, host)
            db.execute(text(f"ALTER USER {account} IDENTIFIED BY :password"), {"password": password})
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)


@router.patch("/{username}/role", response_model=UserRead)
def update_role(username: str, payload: UserRoleUpdateRequest, db: Session = Depends(get_db), _: UserRead = Depends(require_roles("admin"))) -> UserRead:
    username = _validate_username(username)
    role = _validate_role(payload.role)
    db_role = APP_ROLE_TO_DB_ROLE[role]
    try:
        hosts = _existing_hosts(db, username)
        if not hosts:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        for host in hosts:
            account = _account_spec(username, host)
            current_role = _get_role_from_grants(db, username, host)
            if current_role != "unknown":
                current_db_role = APP_ROLE_TO_DB_ROLE[current_role]
                if current_db_role != db_role:
                    db.execute(text(f"REVOKE '{current_db_role}' FROM {account}"))
            db.execute(text(f"GRANT '{db_role}' TO {account}"))
            db.execute(text(f"SET DEFAULT ROLE '{db_role}' FOR {account}"))

        db.commit()
        return UserRead(username=username, role=role, displayName=_display_name_for(role, username))
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)


@router.delete("/{username}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(username: str, db: Session = Depends(get_db), _: UserRead = Depends(require_roles("admin"))) -> Response:
    username = _validate_username(username)
    try:
        hosts = _existing_hosts(db, username)
        if not hosts:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        for host in hosts:
            account = _account_spec(username, host)
            db.execute(text(f"DROP USER IF EXISTS {account}"))
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)
