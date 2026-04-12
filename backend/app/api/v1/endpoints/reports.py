from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import require_access_user, require_roles, UserRead
from app.db.session import get_db

router = APIRouter(tags=["reportes"])


def _handle_sql_error(exc: SQLAlchemyError) -> None:
    raise HTTPException(status_code=503, detail=f"Database unavailable: {exc}") from exc


@router.get("/reportes/inventario-actual")
def inventario_actual(db: Session = Depends(get_db), _: UserRead = Depends(require_access_user)) -> list[dict[str, Any]]:
    try:
        rows = db.execute(text("SELECT Producto, Almacen, stockLocal, precio FROM vista_inventario_actual ORDER BY Producto, Almacen")).mappings().all()
        return [dict(row) for row in rows]
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.get("/reportes/historial-movimientos")
def historial_movimientos(db: Session = Depends(get_db), _: UserRead = Depends(require_access_user)) -> list[dict[str, Any]]:
    try:
        rows = db.execute(
            text("SELECT fecha, tipo, Producto AS producto, cantidad, usuario, Almacen AS almacen FROM vista_historial_movimientos ORDER BY fecha DESC")
        ).mappings().all()
        return [dict(row) for row in rows]
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.get("/reportes/productos-mayor-movimiento")
def productos_mayor_movimiento(db: Session = Depends(get_db), _: UserRead = Depends(require_access_user)) -> list[dict[str, Any]]:
    try:
        rows = db.execute(
            text(
                """
                SELECT p.idProducto, p.nombre, COUNT(d.idDetalle) AS totalMovimientos, SUM(d.cantidad) AS cantidadTotalMovida
                FROM Productos p
                JOIN detalleMovimientos d ON d.idProducto = p.idProducto
                GROUP BY p.idProducto, p.nombre
                HAVING COUNT(d.idDetalle) > 1
                ORDER BY totalMovimientos DESC, cantidadTotalMovida DESC
                """
            )
        ).mappings().all()
        return [dict(row) for row in rows]
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.get("/reportes/productos-bajo-promedio")
def productos_bajo_promedio(db: Session = Depends(get_db), _: UserRead = Depends(require_access_user)) -> list[dict[str, Any]]:
    try:
        rows = db.execute(
            text(
                """
                SELECT p.idProducto, p.nombre, p.idCategoria, p.idProveedor, p.precio, p.stockTotal, p.stockMin
                FROM Productos p
                WHERE p.stockTotal < (SELECT AVG(stockTotal) FROM Productos)
                ORDER BY p.stockTotal ASC
                """
            )
        ).mappings().all()
        return [dict(row) for row in rows]
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.get("/reportes/stock-local")
def stock_local(idProducto: int, idAlmacen: int, db: Session = Depends(get_db), _: UserRead = Depends(require_access_user)) -> dict[str, Any]:
    try:
        row = db.execute(
            text("SELECT fn_consultar_inventario(:id_producto, :id_almacen) AS stockLocal"),
            {"id_producto": idProducto, "id_almacen": idAlmacen},
        ).mappings().one()
        return {"idProducto": idProducto, "idAlmacen": idAlmacen, "stockLocal": int(row["stockLocal"] or 0)}
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.get("/reportes/nivel-stock/{idProducto}")
def nivel_stock(idProducto: int, db: Session = Depends(get_db), _: UserRead = Depends(require_access_user)) -> dict[str, Any]:
    try:
        row = db.execute(
            text("SELECT fn_nivel_stock(:id_producto) AS nivelStock"),
            {"id_producto": idProducto},
        ).mappings().one()
        return {"idProducto": idProducto, "nivelStock": str(row["nivelStock"])}
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.get("/reportes/sp-consultar-inventario")
def sp_consultar_inventario(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    try:
        rows = db.execute(text("CALL sp_consultar_inventario()"))
        data = rows.mappings().all()
        return [dict(row) for row in data]
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)
