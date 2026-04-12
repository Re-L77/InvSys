// Mock data for InvSys Sistema de Inventarios

export type UserRole = 'admin' | 'almacenista' | 'supervisor';

export interface User {
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
}

export interface Categoria {
  idCategoria: number;
  nombre: string;
}

export interface Proveedor {
  idProveedor: number;
  nombre: string;
  email: string;
  telefono: string;
}

export interface Producto {
  idProducto: number;
  nombre: string;
  idCategoria: number;
  idProveedor: number;
  precio: number;
  stockTotal: number;
  stockMin: number;
}

export interface Almacen {
  idAlmacen: number;
  nombre: string;
}

export interface Inventario {
  idInventario: number;
  idProducto: number;
  idAlmacen: number;
  stockLocal: number;
}

export interface Movimiento {
  idMovimiento: number;
  idAlmacen: number;
  usuario: string;
  fecha: string;
  tipo: 'entrada' | 'salida';
}

export interface DetalleMovimiento {
  idDetalle: number;
  idMovimiento: number;
  idProducto: number;
  cantidad: number;
}

// Users
export const users: User[] = [
  { username: 'admin_user', password: 'Admin123!', role: 'admin', displayName: 'Administrador' },
  { username: 'almacen_user', password: 'Almacen123!', role: 'almacenista', displayName: 'Almacenista' },
  { username: 'super_user', password: 'Super123!', role: 'supervisor', displayName: 'Supervisor' },
];

// Categorías
export const categorias: Categoria[] = [
  { idCategoria: 1, nombre: 'Electrónica' },
  { idCategoria: 2, nombre: 'Ropa' },
  { idCategoria: 3, nombre: 'Alimentos' },
  { idCategoria: 4, nombre: 'Hogar' },
  { idCategoria: 5, nombre: 'Deportes' },
  { idCategoria: 6, nombre: 'Juguetes' },
  { idCategoria: 7, nombre: 'Herramientas' },
  { idCategoria: 8, nombre: 'Oficina' },
  { idCategoria: 9, nombre: 'Jardín' },
  { idCategoria: 10, nombre: 'Automotriz' },
  { idCategoria: 11, nombre: 'Salud' },
  { idCategoria: 12, nombre: 'Belleza' },
  { idCategoria: 13, nombre: 'Mascotas' },
  { idCategoria: 14, nombre: 'Libros' },
  { idCategoria: 15, nombre: 'Tecnología' },
  { idCategoria: 16, nombre: 'Muebles' },
  { idCategoria: 17, nombre: 'Calzado' },
  { idCategoria: 18, nombre: 'Accesorios' },
  { idCategoria: 19, nombre: 'Limpieza' },
  { idCategoria: 20, nombre: 'Papelería' },
];

// Proveedores
export const proveedores: Proveedor[] = [
  { idProveedor: 1, nombre: 'TechWorld', email: 'ventas@techworld.com', telefono: '4421001001' },
  { idProveedor: 2, nombre: 'ModaExpress', email: 'contacto@modaexpress.com', telefono: '4421001002' },
  { idProveedor: 3, nombre: 'AlimentosMX', email: 'pedidos@alimentosmx.com', telefono: '4421001003' },
  { idProveedor: 4, nombre: 'HogarPlus', email: 'info@hogarplus.com', telefono: '4421001004' },
  { idProveedor: 5, nombre: 'DeportTotal', email: 'ventas@deporttotal.com', telefono: '4421001005' },
  { idProveedor: 6, nombre: 'JugueteLand', email: 'compras@jugueteland.com', telefono: '4421001006' },
  { idProveedor: 7, nombre: 'FerreMas', email: 'contacto@ferremas.com', telefono: '4421001007' },
  { idProveedor: 8, nombre: 'OficinaYa', email: 'pedidos@oficinaya.com', telefono: '4421001008' },
  { idProveedor: 9, nombre: 'JardinVerde', email: 'ventas@jardinverde.com', telefono: '4421001009' },
  { idProveedor: 10, nombre: 'AutoPartes', email: 'info@autopartes.com', telefono: '4421001010' },
  { idProveedor: 11, nombre: 'SaludVital', email: 'contacto@saludvital.com', telefono: '4421001011' },
  { idProveedor: 12, nombre: 'BellezaPura', email: 'ventas@bellezapura.com', telefono: '4421001012' },
  { idProveedor: 13, nombre: 'PetHappy', email: 'info@pethappy.com', telefono: '4421001013' },
  { idProveedor: 14, nombre: 'LibroMundo', email: 'pedidos@libromundo.com', telefono: '4421001014' },
  { idProveedor: 15, nombre: 'InnoTech', email: 'ventas@innotech.com', telefono: '4421001015' },
  { idProveedor: 16, nombre: 'MueblesFinos', email: 'contacto@mueblesfinos.com', telefono: '4421001016' },
  { idProveedor: 17, nombre: 'CalzadoPro', email: 'info@calzadopro.com', telefono: '4421001017' },
  { idProveedor: 18, nombre: 'AccesoriosMX', email: 'ventas@accesoriosmx.com', telefono: '4421001018' },
  { idProveedor: 19, nombre: 'LimpiaMax', email: 'pedidos@limpiamax.com', telefono: '4421001019' },
  { idProveedor: 20, nombre: 'PapelYMas', email: 'contacto@papelmas.com', telefono: '4421001020' },
];

// Productos
export const productos: Producto[] = [
  { idProducto: 1, nombre: 'Laptop HP 15"', idCategoria: 1, idProveedor: 1, precio: 12500.00, stockTotal: 45, stockMin: 5 },
  { idProducto: 2, nombre: 'Camiseta Polo', idCategoria: 2, idProveedor: 2, precio: 350.00, stockTotal: 80, stockMin: 20 },
  { idProducto: 3, nombre: 'Arroz Premium 1kg', idCategoria: 3, idProveedor: 3, precio: 45.00, stockTotal: 165, stockMin: 50 },
  { idProducto: 4, nombre: 'Sartén Antiadherente', idCategoria: 4, idProveedor: 4, precio: 280.00, stockTotal: 35, stockMin: 15 },
  { idProducto: 5, nombre: 'Balón de Fútbol', idCategoria: 5, idProveedor: 5, precio: 450.00, stockTotal: 62, stockMin: 10 },
  { idProducto: 6, nombre: 'Rompecabezas 1000pz', idCategoria: 6, idProveedor: 6, precio: 220.00, stockTotal: 53, stockMin: 10 },
  { idProducto: 7, nombre: 'Taladro Inalámbrico', idCategoria: 7, idProveedor: 7, precio: 1800.00, stockTotal: 35, stockMin: 8 },
  { idProducto: 8, nombre: 'Resma Papel A4', idCategoria: 8, idProveedor: 8, precio: 120.00, stockTotal: 100, stockMin: 30 },
  { idProducto: 9, nombre: 'Manguera 15m', idCategoria: 9, idProveedor: 9, precio: 350.00, stockTotal: 50, stockMin: 10 },
  { idProducto: 10, nombre: 'Aceite Motor 5W30', idCategoria: 10, idProveedor: 10, precio: 280.00, stockTotal: 65, stockMin: 15 },
  { idProducto: 11, nombre: 'Vitaminas C 100tab', idCategoria: 11, idProveedor: 11, precio: 150.00, stockTotal: 50, stockMin: 25 },
  { idProducto: 12, nombre: 'Shampoo Orgánico', idCategoria: 12, idProveedor: 12, precio: 95.00, stockTotal: 35, stockMin: 20 },
  { idProducto: 13, nombre: 'Croquetas Perro 10kg', idCategoria: 13, idProveedor: 13, precio: 520.00, stockTotal: 30, stockMin: 15 },
  { idProducto: 14, nombre: 'Novela Best Seller', idCategoria: 14, idProveedor: 14, precio: 180.00, stockTotal: 25, stockMin: 10 },
  { idProducto: 15, nombre: 'Mouse Inalámbrico', idCategoria: 15, idProveedor: 15, precio: 250.00, stockTotal: 45, stockMin: 20 },
  { idProducto: 16, nombre: 'Escritorio Madera', idCategoria: 16, idProveedor: 16, precio: 3500.00, stockTotal: 15, stockMin: 5 },
  { idProducto: 17, nombre: 'Tenis Running', idCategoria: 17, idProveedor: 17, precio: 1200.00, stockTotal: 30, stockMin: 12 },
  { idProducto: 18, nombre: 'Funda Celular', idCategoria: 18, idProveedor: 18, precio: 85.00, stockTotal: 55, stockMin: 30 },
  { idProducto: 19, nombre: 'Cloro 1L', idCategoria: 19, idProveedor: 19, precio: 25.00, stockTotal: 70, stockMin: 40 },
  { idProducto: 20, nombre: 'Cuaderno 100 hojas', idCategoria: 20, idProveedor: 20, precio: 35.00, stockTotal: 90, stockMin: 50 },
];

// Almacenes
export const almacenes: Almacen[] = [
  { idAlmacen: 1, nombre: 'Almacén Central' },
  { idAlmacen: 2, nombre: 'Almacén Norte' },
  { idAlmacen: 3, nombre: 'Almacén Sur' },
  { idAlmacen: 4, nombre: 'Almacén Este' },
  { idAlmacen: 5, nombre: 'Almacén Oeste' },
  { idAlmacen: 6, nombre: 'Bodega Principal' },
  { idAlmacen: 7, nombre: 'Bodega Secundaria' },
  { idAlmacen: 8, nombre: 'Centro Distribución A' },
  { idAlmacen: 9, nombre: 'Centro Distribución B' },
  { idAlmacen: 10, nombre: 'Centro Distribución C' },
  { idAlmacen: 11, nombre: 'Sucursal Querétaro' },
  { idAlmacen: 12, nombre: 'Sucursal CDMX' },
  { idAlmacen: 13, nombre: 'Sucursal Guadalajara' },
  { idAlmacen: 14, nombre: 'Sucursal Monterrey' },
  { idAlmacen: 15, nombre: 'Sucursal Puebla' },
  { idAlmacen: 16, nombre: 'Almacén Temporal 1' },
  { idAlmacen: 17, nombre: 'Almacén Temporal 2' },
  { idAlmacen: 18, nombre: 'Almacén Devoluciones' },
  { idAlmacen: 19, nombre: 'Almacén Mayoreo' },
  { idAlmacen: 20, nombre: 'Almacén Menudeo' },
];

// Inventarios (stock local por almacén)
export const inventarios: Inventario[] = [
  { idInventario: 1, idProducto: 1, idAlmacen: 1, stockLocal: 25 },
  { idInventario: 2, idProducto: 1, idAlmacen: 2, stockLocal: 20 },
  { idInventario: 3, idProducto: 2, idAlmacen: 1, stockLocal: 40 },
  { idInventario: 4, idProducto: 2, idAlmacen: 3, stockLocal: 40 },
  { idInventario: 5, idProducto: 3, idAlmacen: 1, stockLocal: 85 },
  { idInventario: 6, idProducto: 3, idAlmacen: 4, stockLocal: 80 },
  { idInventario: 7, idProducto: 4, idAlmacen: 1, stockLocal: 35 },
  { idInventario: 8, idProducto: 5, idAlmacen: 2, stockLocal: 32 },
  { idInventario: 9, idProducto: 5, idAlmacen: 3, stockLocal: 30 },
  { idInventario: 10, idProducto: 6, idAlmacen: 1, stockLocal: 33 },
];

// Movimientos
export const movimientos: Movimiento[] = [
  { idMovimiento: 1, idAlmacen: 1, usuario: 'admin_user', fecha: '2026-04-12 10:30:00', tipo: 'entrada' },
  { idMovimiento: 2, idAlmacen: 2, usuario: 'admin_user', fecha: '2026-04-12 09:15:00', tipo: 'entrada' },
  { idMovimiento: 3, idAlmacen: 1, usuario: 'almacen_user', fecha: '2026-04-12 11:15:00', tipo: 'salida' },
  { idMovimiento: 4, idAlmacen: 1, usuario: 'admin_user', fecha: '2026-04-11 14:20:00', tipo: 'entrada' },
  { idMovimiento: 5, idAlmacen: 3, usuario: 'almacen_user', fecha: '2026-04-11 16:45:00', tipo: 'entrada' },
  { idMovimiento: 6, idAlmacen: 1, usuario: 'almacen_user', fecha: '2026-04-10 08:30:00', tipo: 'salida' },
];

// Detalle Movimientos
export const detalleMovimientos: DetalleMovimiento[] = [
  { idDetalle: 1, idMovimiento: 1, idProducto: 1, cantidad: 30 },
  { idDetalle: 2, idMovimiento: 2, idProducto: 1, cantidad: 20 },
  { idDetalle: 3, idMovimiento: 3, idProducto: 2, cantidad: 10 },
  { idDetalle: 4, idMovimiento: 4, idProducto: 3, cantidad: 100 },
  { idDetalle: 5, idMovimiento: 5, idProducto: 2, cantidad: 40 },
  { idDetalle: 6, idMovimiento: 6, idProducto: 1, cantidad: 5 },
];

// Helper function to get nivel de stock
export function getNivelStock(idProducto: number): 'Bajo' | 'Medio' | 'Alto' {
  const producto = productos.find(p => p.idProducto === idProducto);
  if (!producto) return 'Bajo';

  if (producto.stockTotal <= producto.stockMin) return 'Bajo';
  if (producto.stockTotal <= producto.stockMin * 2) return 'Medio';
  return 'Alto';
}

// Helper to get stock local
export function getStockLocal(idProducto: number, idAlmacen: number): number {
  const inv = inventarios.find(i => i.idProducto === idProducto && i.idAlmacen === idAlmacen);
  return inv?.stockLocal || 0;
}
