from __future__ import annotations

from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import require_access_user, require_roles, UserRead
from app.db.session import get_db

router = APIRouter(tags=["movimientos"])


def _handle_sql_error(exc: SQLAlchemyError) -> None:
    if isinstance(exc, IntegrityError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Database constraint violation") from exc
    raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Database unavailable: {exc}") from exc


def _require_int(value: Any, field_name: str, minimum: int = 1) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{field_name} must be an integer")
    if value < minimum:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{field_name} must be >= {minimum}")
    return value


def _require_str(value: Any, field_name: str, allowed: set[str] | None = None) -> str:
    if not isinstance(value, str) or not value.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{field_name} must be a string")
    cleaned = value.strip()
    if allowed is not None and cleaned not in allowed:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{field_name} is invalid")
    return cleaned


def _require_date(value: str | None, field_name: str) -> date | None:
    if value is None:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{field_name} must be YYYY-MM-DD") from exc


def _movement_detail(db: Session, id_movimiento: int) -> dict[str, Any]:
    row = db.execute(
        text(
            """
            SELECT m.idMovimiento, m.idAlmacen, m.usuario, m.fecha, m.tipo,
                   d.idDetalle, d.idProducto, d.cantidad
            FROM Movimientos m
            JOIN detalleMovimientos d ON d.idMovimiento = m.idMovimiento
            WHERE m.idMovimiento = :id_movimiento
            ORDER BY d.idDetalle
            LIMIT 1
            """
        ),
        {"id_movimiento": id_movimiento},
    ).mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movimiento not found")
    detalles = db.execute(
        text(
            """
            SELECT idDetalle, idMovimiento, idProducto, cantidad
            FROM detalleMovimientos
            WHERE idMovimiento = :id_movimiento
            ORDER BY idDetalle
            """
        ),
        {"id_movimiento": id_movimiento},
    ).mappings().all()
    result = dict(row)
    result["detalles"] = [dict(item) for item in detalles]
    return result


@router.get("/movimientos")
def list_movimientos(
    idAlmacen: int | None = None,
    tipo: str | None = None,
    fechaDesde: str | None = None,
    fechaHasta: str | None = None,
    db: Session = Depends(get_db),
    _: UserRead = Depends(require_roles("admin", "almacenista", "supervisor")),
) -> list[dict[str, Any]]:
    try:
        conditions: list[str] = []
        params: dict[str, Any] = {}

        if idAlmacen is not None:
            params["id_almacen"] = _require_int(idAlmacen, "idAlmacen")
            conditions.append("m.idAlmacen = :id_almacen")
        if tipo is not None:
            params["tipo"] = _require_str(tipo, "tipo", {"entrada", "salida"})
            conditions.append("m.tipo = :tipo")
        start_date = _require_date(fechaDesde, "fechaDesde")
        end_date = _require_date(fechaHasta, "fechaHasta")
        if start_date is not None:
            params["fecha_desde"] = start_date
            conditions.append("DATE(m.fecha) >= :fecha_desde")
        if end_date is not None:
            params["fecha_hasta"] = end_date
            conditions.append("DATE(m.fecha) <= :fecha_hasta")

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        rows = db.execute(
            text(
                f"""
                SELECT
                    m.idMovimiento,
                    m.idAlmacen,
                    a.nombre AS almacenNombre,
                    m.usuario,
                    m.fecha,
                    m.tipo
                FROM Movimientos m
                JOIN Almacenes a ON a.idAlmacen = m.idAlmacen
                {where_clause}
                ORDER BY m.fecha DESC, m.idMovimiento DESC
                """
            ),
            params,
        ).mappings().all()
        return [dict(row) for row in rows]
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.post("/movimientos", status_code=status.HTTP_201_CREATED)
def create_movimiento(payload: dict[str, Any], db: Session = Depends(get_db), _: UserRead = Depends(require_roles("admin", "almacenista"))) -> dict[str, Any]:
    id_almacen = _require_int(payload.get("idAlmacen"), "idAlmacen")
    id_producto = _require_int(payload.get("idProducto"), "idProducto")
    cantidad = _require_int(payload.get("cantidad"), "cantidad")
    tipo = _require_str(payload.get("tipo"), "tipo", {"entrada", "salida"})
    usuario = str(payload.get("usuario") or "system").strip() or "system"

    try:
        db.execute(
            text("CALL sp_registrar_movimiento_completo(:id_almacen, :usuario, :tipo, :id_producto, :cantidad)"),
            {
                "id_almacen": id_almacen,
                "usuario": usuario,
                "tipo": tipo,
                "id_producto": id_producto,
                "cantidad": cantidad,
            },
        )
        db.commit()
        created = db.execute(
            text(
                """
                SELECT idMovimiento
                FROM Movimientos
                WHERE idAlmacen = :id_almacen AND usuario = :usuario AND tipo = :tipo
                ORDER BY idMovimiento DESC
                LIMIT 1
                """
            ),
            {"id_almacen": id_almacen, "usuario": usuario, "tipo": tipo},
        ).mappings().one()
        return _movement_detail(db, int(created["idMovimiento"]))
    except SQLAlchemyError as exc:
        db.rollback()
        # Captura errores específicos del procedimiento
        error_message = str(exc.orig) if hasattr(exc, 'orig') else str(exc)
        if "Stock insuficiente" in error_message or "stock" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        _handle_sql_error(exc)


@router.get("/movimientos/{id_movimiento}")
def get_movimiento(id_movimiento: int, db: Session = Depends(get_db), _: UserRead = Depends(require_roles("admin", "almacenista", "supervisor"))) -> dict[str, Any]:
    try:
        return _movement_detail(db, _require_int(id_movimiento, "idMovimiento"))
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.get("/movimientos/historial")
def historial_movimientos(db: Session = Depends(get_db), _: UserRead = Depends(require_roles("admin", "almacenista", "supervisor"))) -> list[dict[str, Any]]:
    try:
        rows = db.execute(
            text(
                """
                SELECT
                    m.fecha,
                    m.tipo,
                    p.nombre AS producto,
                    d.cantidad,
                    m.usuario,
                    a.nombre AS almacen
                FROM Movimientos m
                JOIN detalleMovimientos d ON d.idMovimiento = m.idMovimiento
                JOIN Productos p ON p.idProducto = d.idProducto
                JOIN Almacenes a ON a.idAlmacen = m.idAlmacen
                ORDER BY m.fecha DESC, m.idMovimiento DESC, d.idDetalle DESC
                """
            )
        ).mappings().all()
        return [dict(row) for row in rows]
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)
