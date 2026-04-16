import { apiRequest } from './client';

export interface ProductoRecord {
  idProducto: number;
  nombre: string;
  idCategoria: number;
  categoriaNombre: string;
  idProveedor: number;
  proveedorNombre: string;
  precio: number;
  stockTotal: number;
  stockMin: number;
}

export interface AlmacenRecord {
  idAlmacen: number;
  nombre: string;
}

export interface CategoriaRecord {
  idCategoria: number;
  nombre: string;
}

export interface ProveedorRecord {
  idProveedor: number;
  nombre: string;
  email: string;
  telefono: string | null;
}

export interface InventarioRecord {
  idInventario: number;
  idProducto: number;
  productoNombre: string;
  idAlmacen: number;
  almacenNombre: string;
  stockLocal: number;
}

export interface MovimientoHistorialRecord {
  fecha: string;
  tipo: 'entrada' | 'salida';
  producto: string;
  cantidad: number;
  usuario: string;
  almacen: string;
}

export interface MovimientoCreatePayload {
  idAlmacen: number;
  tipo: 'entrada' | 'salida';
  idProducto: number;
  cantidad: number;
  usuario?: string;
}

export interface MovimientoDetalleRecord {
  idMovimiento: number;
  idAlmacen: number;
  usuario: string;
  fecha: string;
  tipo: 'entrada' | 'salida';
  detalles: Array<{
    idDetalle: number;
    idMovimiento: number;
    idProducto: number;
    cantidad: number;
  }>;
}

export interface ProductoPayload {
  nombre: string;
  idCategoria: number;
  idProveedor: number;
  precio: number;
  stockTotal?: number;
  stockMin: number;
}

export interface CategoriaPayload {
  nombre: string;
}

export interface ProveedorPayload {
  nombre: string;
  email: string;
  telefono?: string;
}

export interface AlmacenPayload {
  nombre: string;
}

export async function getProductos(idCategoria?: number | null, idProveedor?: number | null, q?: string) {
  const params = new URLSearchParams();
  if (idCategoria) params.append('idCategoria', String(idCategoria));
  if (idProveedor) params.append('idProveedor', String(idProveedor));
  if (q) params.append('q', q);
  const queryString = params.toString();
  return apiRequest<ProductoRecord[]>(`/productos${queryString ? '?' + queryString : ''}`);
}

export async function createProducto(payload: ProductoPayload) {
  return apiRequest<ProductoRecord>('/productos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProducto(idProducto: number, payload: ProductoPayload) {
  return apiRequest<ProductoRecord>(`/productos/${idProducto}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProducto(idProducto: number) {
  return apiRequest<void>(`/productos/${idProducto}`, {
    method: 'DELETE',
  });
}

export async function getAlmacenes() {
  return apiRequest<AlmacenRecord[]>('/almacenes');
}

export async function getCategorias() {
  return apiRequest<CategoriaRecord[]>('/categorias');
}

export async function getProveedores() {
  return apiRequest<ProveedorRecord[]>('/proveedores');
}

export async function getInventario(idAlmacen?: number | null, bajoStock?: boolean) {
  const params = new URLSearchParams();
  if (idAlmacen) params.append('idAlmacen', String(idAlmacen));
  if (bajoStock) params.append('bajoStock', String(bajoStock));
  const queryString = params.toString();
  return apiRequest<InventarioRecord[]>(`/inventario${queryString ? '?' + queryString : ''}`);
}

export async function getHistorialMovimientos(
  idAlmacen?: number | null,
  tipo?: string,
  fechaDesde?: string,
  fechaHasta?: string
) {
  const params = new URLSearchParams();
  if (idAlmacen) params.append('idAlmacen', String(idAlmacen));
  if (tipo) params.append('tipo', tipo);
  if (fechaDesde) params.append('fechaDesde', fechaDesde);
  if (fechaHasta) params.append('fechaHasta', fechaHasta);
  const queryString = params.toString();
  return apiRequest<MovimientoHistorialRecord[]>(`/reportes/historial-movimientos${queryString ? '?' + queryString : ''}`);
}

export async function createCategoria(payload: CategoriaPayload) {
  return apiRequest<CategoriaRecord>('/categorias', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCategoria(idCategoria: number, payload: CategoriaPayload) {
  return apiRequest<CategoriaRecord>(`/categorias/${idCategoria}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCategoria(idCategoria: number) {
  return apiRequest<void>(`/categorias/${idCategoria}`, {
    method: 'DELETE',
  });
}

export async function createProveedor(payload: ProveedorPayload) {
  return apiRequest<ProveedorRecord>('/proveedores', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProveedor(idProveedor: number, payload: ProveedorPayload) {
  return apiRequest<ProveedorRecord>(`/proveedores/${idProveedor}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProveedor(idProveedor: number) {
  return apiRequest<void>(`/proveedores/${idProveedor}`, {
    method: 'DELETE',
  });
}

export async function createAlmacen(payload: AlmacenPayload) {
  return apiRequest<AlmacenRecord>('/almacenes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAlmacen(idAlmacen: number, payload: AlmacenPayload) {
  return apiRequest<AlmacenRecord>(`/almacenes/${idAlmacen}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAlmacen(idAlmacen: number) {
  return apiRequest<void>(`/almacenes/${idAlmacen}`, {
    method: 'DELETE',
  });
}

export async function createMovimiento(payload: MovimientoCreatePayload) {
  return apiRequest<MovimientoDetalleRecord>('/movimientos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}