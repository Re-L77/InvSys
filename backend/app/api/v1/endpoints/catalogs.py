from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.session import get_db

router = APIRouter(tags=["catalogs"])


class NotFoundError(Exception):
    pass


class ConflictError(Exception):
    pass


def _rows_to_dicts(rows: list[Any]) -> list[dict[str, Any]]:
    return [dict(row) for row in rows]


def _clean_text(value: Any, field_name: str, min_length: int = 1, max_length: int = 255) -> str:
    if not isinstance(value, str):
        raise HTTPException(status_code=422, detail=f"{field_name} must be a string")
    cleaned = value.strip()
    if len(cleaned) < min_length:
        raise HTTPException(status_code=422, detail=f"{field_name} is too short")
    if len(cleaned) > max_length:
        raise HTTPException(status_code=422, detail=f"{field_name} is too long")
    return cleaned


def _clean_int(value: Any, field_name: str, minimum: int = 1) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise HTTPException(status_code=422, detail=f"{field_name} must be an integer")
    if value < minimum:
        raise HTTPException(status_code=422, detail=f"{field_name} must be >= {minimum}")
    return value


def _clean_float(value: Any, field_name: str, minimum: float = 0.0) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise HTTPException(status_code=422, detail=f"{field_name} must be a number")
    numeric = float(value)
    if numeric <= minimum:
        raise HTTPException(status_code=422, detail=f"{field_name} must be > {minimum}")
    return numeric


def _get_single_row(db: Session, sql: str, params: dict[str, Any]) -> dict[str, Any] | None:
    return db.execute(text(sql), params).mappings().one_or_none()


def _require_row(db: Session, sql: str, params: dict[str, Any], entity_name: str) -> dict[str, Any]:
    row = _get_single_row(db, sql, params)
    if row is None:
        raise HTTPException(status_code=404, detail=f"{entity_name} not found")
    return row


def _handle_sql_error(exc: SQLAlchemyError) -> None:
    if isinstance(exc, IntegrityError):
        raise HTTPException(status_code=409, detail="Database constraint violation") from exc
    raise HTTPException(status_code=503, detail=f"Database unavailable: {exc}") from exc


@router.get("/categorias")
def list_categorias(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    try:
        rows = db.execute(text("SELECT idCategoria, nombre FROM Categorias ORDER BY idCategoria")).mappings().all()
        return _rows_to_dicts(rows)
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.get("/categorias/{id_categoria}")
def get_categoria(id_categoria: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return _require_row(
            db,
            "SELECT idCategoria, nombre FROM Categorias WHERE idCategoria = :id_categoria",
            {"id_categoria": id_categoria},
            "Categoria",
        )
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.post("/categorias", status_code=status.HTTP_201_CREATED)
def create_categoria(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    nombre = _clean_text(payload.get("nombre"), "nombre", 2, 50)
    try:
        result = db.execute(text("INSERT INTO Categorias (nombre) VALUES (:nombre)"), {"nombre": nombre})
        db.commit()
        return {
            "idCategoria": result.lastrowid,
            "nombre": nombre,
        }
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)


@router.put("/categorias/{id_categoria}")
def update_categoria(id_categoria: int, payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    nombre = _clean_text(payload.get("nombre"), "nombre", 2, 50)
    try:
        existing = _require_row(
            db,
            "SELECT idCategoria, nombre FROM Categorias WHERE idCategoria = :id_categoria",
            {"id_categoria": id_categoria},
            "Categoria",
        )
        db.execute(
            text("UPDATE Categorias SET nombre = :nombre WHERE idCategoria = :id_categoria"),
            {"nombre": nombre, "id_categoria": id_categoria},
        )
        db.commit()
        existing["nombre"] = nombre
        return existing
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)


@router.delete("/categorias/{id_categoria}", status_code=status.HTTP_204_NO_CONTENT)
def delete_categoria(id_categoria: int, db: Session = Depends(get_db)) -> Response:
    try:
        _require_row(
            db,
            "SELECT idCategoria FROM Categorias WHERE idCategoria = :id_categoria",
            {"id_categoria": id_categoria},
            "Categoria",
        )
        db.execute(text("DELETE FROM Categorias WHERE idCategoria = :id_categoria"), {"id_categoria": id_categoria})
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)


@router.get("/proveedores")
def list_proveedores(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    try:
        rows = db.execute(
            text("SELECT idProveedor, nombre, email, telefono FROM Proveedores ORDER BY idProveedor")
        ).mappings().all()
        return _rows_to_dicts(rows)
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.get("/proveedores/{id_proveedor}")
def get_proveedor(id_proveedor: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return _require_row(
            db,
            "SELECT idProveedor, nombre, email, telefono FROM Proveedores WHERE idProveedor = :id_proveedor",
            {"id_proveedor": id_proveedor},
            "Proveedor",
        )
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.post("/proveedores", status_code=status.HTTP_201_CREATED)
def create_proveedor(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    nombre = _clean_text(payload.get("nombre"), "nombre", 2, 100)
    email = _clean_text(payload.get("email"), "email", 5, 100)
    telefono = _clean_text(payload.get("telefono", ""), "telefono", 0, 20)
    try:
        result = db.execute(
            text("INSERT INTO Proveedores (nombre, email, telefono) VALUES (:nombre, :email, :telefono)"),
            {"nombre": nombre, "email": email, "telefono": telefono or None},
        )
        db.commit()
        return {"idProveedor": result.lastrowid, "nombre": nombre, "email": email, "telefono": telefono}
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)


@router.put("/proveedores/{id_proveedor}")
def update_proveedor(id_proveedor: int, payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    nombre = _clean_text(payload.get("nombre"), "nombre", 2, 100)
    email = _clean_text(payload.get("email"), "email", 5, 100)
    telefono = _clean_text(payload.get("telefono", ""), "telefono", 0, 20)
    try:
        _require_row(
            db,
            "SELECT idProveedor FROM Proveedores WHERE idProveedor = :id_proveedor",
            {"id_proveedor": id_proveedor},
            "Proveedor",
        )
        db.execute(
            text(
                "UPDATE Proveedores SET nombre = :nombre, email = :email, telefono = :telefono WHERE idProveedor = :id_proveedor"
            ),
            {
                "nombre": nombre,
                "email": email,
                "telefono": telefono or None,
                "id_proveedor": id_proveedor,
            },
        )
        db.commit()
        return {"idProveedor": id_proveedor, "nombre": nombre, "email": email, "telefono": telefono}
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)


@router.delete("/proveedores/{id_proveedor}", status_code=status.HTTP_204_NO_CONTENT)
def delete_proveedor(id_proveedor: int, db: Session = Depends(get_db)) -> Response:
    try:
        _require_row(
            db,
            "SELECT idProveedor FROM Proveedores WHERE idProveedor = :id_proveedor",
            {"id_proveedor": id_proveedor},
            "Proveedor",
        )
        db.execute(text("DELETE FROM Proveedores WHERE idProveedor = :id_proveedor"), {"id_proveedor": id_proveedor})
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)


@router.get("/almacenes")
def list_almacenes(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    try:
        rows = db.execute(text("SELECT idAlmacen, nombre FROM Almacenes ORDER BY idAlmacen")).mappings().all()
        return _rows_to_dicts(rows)
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.get("/almacenes/{id_almacen}")
def get_almacen(id_almacen: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return _require_row(
            db,
            "SELECT idAlmacen, nombre FROM Almacenes WHERE idAlmacen = :id_almacen",
            {"id_almacen": id_almacen},
            "Almacen",
        )
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.post("/almacenes", status_code=status.HTTP_201_CREATED)
def create_almacen(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    nombre = _clean_text(payload.get("nombre"), "nombre", 2, 100)
    try:
        result = db.execute(text("INSERT INTO Almacenes (nombre) VALUES (:nombre)"), {"nombre": nombre})
        db.commit()
        return {"idAlmacen": result.lastrowid, "nombre": nombre}
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)


@router.put("/almacenes/{id_almacen}")
def update_almacen(id_almacen: int, payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    nombre = _clean_text(payload.get("nombre"), "nombre", 2, 100)
    try:
        _require_row(
            db,
            "SELECT idAlmacen FROM Almacenes WHERE idAlmacen = :id_almacen",
            {"id_almacen": id_almacen},
            "Almacen",
        )
        db.execute(
            text("UPDATE Almacenes SET nombre = :nombre WHERE idAlmacen = :id_almacen"),
            {"nombre": nombre, "id_almacen": id_almacen},
        )
        db.commit()
        return {"idAlmacen": id_almacen, "nombre": nombre}
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)


@router.delete("/almacenes/{id_almacen}", status_code=status.HTTP_204_NO_CONTENT)
def delete_almacen(id_almacen: int, db: Session = Depends(get_db)) -> Response:
    try:
        _require_row(
            db,
            "SELECT idAlmacen FROM Almacenes WHERE idAlmacen = :id_almacen",
            {"id_almacen": id_almacen},
            "Almacen",
        )
        db.execute(text("DELETE FROM Almacenes WHERE idAlmacen = :id_almacen"), {"id_almacen": id_almacen})
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)


@router.get("/productos")
def list_productos(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    try:
        rows = db.execute(
            text(
                """
                SELECT
                    p.idProducto,
                    p.nombre,
                    p.idCategoria,
                    c.nombre AS categoriaNombre,
                    p.idProveedor,
                    pr.nombre AS proveedorNombre,
                    p.precio,
                    p.stockTotal,
                    p.stockMin
                FROM Productos p
                JOIN Categorias c ON c.idCategoria = p.idCategoria
                JOIN Proveedores pr ON pr.idProveedor = p.idProveedor
                ORDER BY p.idProducto
                """
            )
        ).mappings().all()
        return _rows_to_dicts(rows)
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.get("/productos/{id_producto}")
def get_producto(id_producto: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return _require_row(
            db,
            """
            SELECT
                p.idProducto,
                p.nombre,
                p.idCategoria,
                c.nombre AS categoriaNombre,
                p.idProveedor,
                pr.nombre AS proveedorNombre,
                p.precio,
                p.stockTotal,
                p.stockMin
            FROM Productos p
            JOIN Categorias c ON c.idCategoria = p.idCategoria
            JOIN Proveedores pr ON pr.idProveedor = p.idProveedor
            WHERE p.idProducto = :id_producto
            """,
            {"id_producto": id_producto},
            "Producto",
        )
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.post("/productos", status_code=status.HTTP_201_CREATED)
def create_producto(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    nombre = _clean_text(payload.get("nombre"), "nombre", 2, 100)
    id_categoria = _clean_int(payload.get("idCategoria"), "idCategoria")
    id_proveedor = _clean_int(payload.get("idProveedor"), "idProveedor")
    precio = _clean_float(payload.get("precio"), "precio")
    stock_min = _clean_int(payload.get("stockMin", 0), "stockMin", 0)
    stock_total = int(payload.get("stockTotal", 0) or 0)
    if stock_total < 0:
        raise HTTPException(status_code=422, detail="stockTotal must be >= 0")

    try:
        _require_row(
            db,
            "SELECT idCategoria FROM Categorias WHERE idCategoria = :id_categoria",
            {"id_categoria": id_categoria},
            "Categoria",
        )
        _require_row(
            db,
            "SELECT idProveedor FROM Proveedores WHERE idProveedor = :id_proveedor",
            {"id_proveedor": id_proveedor},
            "Proveedor",
        )
        result = db.execute(
            text(
                """
                INSERT INTO Productos (nombre, idCategoria, idProveedor, precio, stockTotal, stockMin)
                VALUES (:nombre, :id_categoria, :id_proveedor, :precio, :stock_total, :stock_min)
                """
            ),
            {
                "nombre": nombre,
                "id_categoria": id_categoria,
                "id_proveedor": id_proveedor,
                "precio": precio,
                "stock_total": stock_total,
                "stock_min": stock_min,
            },
        )
        db.commit()
        return {
            "idProducto": result.lastrowid,
            "nombre": nombre,
            "idCategoria": id_categoria,
            "idProveedor": id_proveedor,
            "precio": precio,
            "stockTotal": stock_total,
            "stockMin": stock_min,
        }
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)


@router.put("/productos/{id_producto}")
def update_producto(id_producto: int, payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    nombre = _clean_text(payload.get("nombre"), "nombre", 2, 100)
    id_categoria = _clean_int(payload.get("idCategoria"), "idCategoria")
    id_proveedor = _clean_int(payload.get("idProveedor"), "idProveedor")
    precio = _clean_float(payload.get("precio"), "precio")
    stock_min = _clean_int(payload.get("stockMin", 0), "stockMin", 0)
    stock_total = int(payload.get("stockTotal", 0) or 0)
    if stock_total < 0:
        raise HTTPException(status_code=422, detail="stockTotal must be >= 0")

    try:
        _require_row(
            db,
            "SELECT idProducto FROM Productos WHERE idProducto = :id_producto",
            {"id_producto": id_producto},
            "Producto",
        )
        _require_row(
            db,
            "SELECT idCategoria FROM Categorias WHERE idCategoria = :id_categoria",
            {"id_categoria": id_categoria},
            "Categoria",
        )
        _require_row(
            db,
            "SELECT idProveedor FROM Proveedores WHERE idProveedor = :id_proveedor",
            {"id_proveedor": id_proveedor},
            "Proveedor",
        )
        db.execute(
            text(
                """
                UPDATE Productos
                SET nombre = :nombre,
                    idCategoria = :id_categoria,
                    idProveedor = :id_proveedor,
                    precio = :precio,
                    stockTotal = :stock_total,
                    stockMin = :stock_min
                WHERE idProducto = :id_producto
                """
            ),
            {
                "nombre": nombre,
                "id_categoria": id_categoria,
                "id_proveedor": id_proveedor,
                "precio": precio,
                "stock_total": stock_total,
                "stock_min": stock_min,
                "id_producto": id_producto,
            },
        )
        db.commit()
        return {
            "idProducto": id_producto,
            "nombre": nombre,
            "idCategoria": id_categoria,
            "idProveedor": id_proveedor,
            "precio": precio,
            "stockTotal": stock_total,
            "stockMin": stock_min,
        }
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)


@router.delete("/productos/{id_producto}", status_code=status.HTTP_204_NO_CONTENT)
def delete_producto(id_producto: int, db: Session = Depends(get_db)) -> Response:
    try:
        _require_row(
            db,
            "SELECT idProducto FROM Productos WHERE idProducto = :id_producto",
            {"id_producto": id_producto},
            "Producto",
        )
        db.execute(text("DELETE FROM Productos WHERE idProducto = :id_producto"), {"id_producto": id_producto})
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)


@router.get("/inventario")
def list_inventario(idAlmacen: int | None = None, bajoStock: bool | None = None, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    try:
        conditions: list[str] = []
        params: dict[str, Any] = {}
        if idAlmacen is not None:
            params["id_almacen"] = _clean_int(idAlmacen, "idAlmacen")
            conditions.append("i.idAlmacen = :id_almacen")
        if bajoStock:
            conditions.append("p.stockTotal <= p.stockMin")

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        rows = db.execute(
            text(
                f"""
                SELECT
                    i.idInventario,
                    i.idProducto,
                    p.nombre AS productoNombre,
                    i.idAlmacen,
                    a.nombre AS almacenNombre,
                    i.stockLocal
                FROM Inventarios i
                JOIN Productos p ON p.idProducto = i.idProducto
                JOIN Almacenes a ON a.idAlmacen = i.idAlmacen
                {where_clause}
                ORDER BY i.idInventario
                """
            ),
            params,
        ).mappings().all()
        return _rows_to_dicts(rows)
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.get("/inventario/{id_producto}/{id_almacen}")
def get_inventario(id_producto: int, id_almacen: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return _require_row(
            db,
                f"""
            SELECT
                i.idInventario,
                i.idProducto,
                p.nombre AS productoNombre,
                i.idAlmacen,
                a.nombre AS almacenNombre,
                i.stockLocal
            FROM Inventarios i
            JOIN Productos p ON p.idProducto = i.idProducto
            JOIN Almacenes a ON a.idAlmacen = i.idAlmacen
            WHERE i.idProducto = :id_producto AND i.idAlmacen = :id_almacen
            """,
            {"id_producto": id_producto, "id_almacen": id_almacen},
            "Inventario",
        )
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.get("/inventario/bajo-stock")
def list_inventario_bajo_stock(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    try:
        rows = db.execute(
            text(
                """
                SELECT
                    p.idProducto,
                    p.nombre,
                    p.idCategoria,
                    p.idProveedor,
                    p.precio,
                    p.stockTotal,
                    p.stockMin
                FROM Productos p
                WHERE p.stockTotal <= p.stockMin
                ORDER BY p.stockTotal ASC, p.idProducto ASC
                """
            )
        ).mappings().all()
        return _rows_to_dicts(rows)
    except SQLAlchemyError as exc:
        _handle_sql_error(exc)


@router.post("/inventario/ajustes", status_code=status.HTTP_201_CREATED)
def create_inventario_ajuste(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    id_producto = _clean_int(payload.get("idProducto"), "idProducto")
    id_almacen = _clean_int(payload.get("idAlmacen"), "idAlmacen")
    cantidad = payload.get("cantidad")
    motivo = _clean_text(payload.get("motivo"), "motivo", 3, 255)

    if isinstance(cantidad, bool) or not isinstance(cantidad, int):
        raise HTTPException(status_code=422, detail="cantidad must be an integer")
    if cantidad == 0:
        raise HTTPException(status_code=422, detail="cantidad cannot be zero")

    try:
        inventario = _require_row(
            db,
            "SELECT idInventario, stockLocal FROM Inventarios WHERE idProducto = :id_producto AND idAlmacen = :id_almacen",
            {"id_producto": id_producto, "id_almacen": id_almacen},
            "Inventario",
        )
        producto = _require_row(
            db,
            "SELECT idProducto, stockTotal FROM Productos WHERE idProducto = :id_producto",
            {"id_producto": id_producto},
            "Producto",
        )

        new_stock_local = int(inventario["stockLocal"]) + cantidad
        new_stock_total = int(producto["stockTotal"]) + cantidad
        if new_stock_local < 0 or new_stock_total < 0:
            raise HTTPException(status_code=409, detail="Ajuste would result in negative stock")

        db.execute(
            text("UPDATE Inventarios SET stockLocal = :stock_local WHERE idProducto = :id_producto AND idAlmacen = :id_almacen"),
            {"stock_local": new_stock_local, "id_producto": id_producto, "id_almacen": id_almacen},
        )
        db.execute(
            text("UPDATE Productos SET stockTotal = :stock_total WHERE idProducto = :id_producto"),
            {"stock_total": new_stock_total, "id_producto": id_producto},
        )
        db.commit()
        return {
            "idProducto": id_producto,
            "idAlmacen": id_almacen,
            "cantidad": cantidad,
            "motivo": motivo,
            "stockLocal": new_stock_local,
            "stockTotal": new_stock_total,
        }
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        _handle_sql_error(exc)
