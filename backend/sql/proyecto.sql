-- ==============================================================================
-- PROYECTO 5: SISTEMA DE INVENTARIOS
-- INTEGRANTES: 
-- ORDAZ MAGOS JUAN PABLO
-- GONZÁLEZ LEÓN ANDRÉS
-- HUANTE RÍOS JOSÉ LUIS
-- TREJO ZAVALA MARCO EDGAR
-- MATERIA: Base de Datos Avanzadas 
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ESTRUCTURA DE LA BASE DE DATOS (DDL)
-- ------------------------------------------------------------------------------
DROP DATABASE IF EXISTS sistemaInventarios;
CREATE DATABASE IF NOT EXISTS sistemaInventarios;
USE sistemaInventarios;

-- Tabla de Categorías para cumplir con 3FN
CREATE TABLE Categorias (
    idCategoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

-- Tabla de Proveedores con restricción UNIQUE
CREATE TABLE Proveedores (
    idProveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL, 
    telefono VARCHAR(20)
);

-- Tabla de Productos con validación de stock positivo
CREATE TABLE Productos (
    idProducto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    idCategoria INT NOT NULL,
    idProveedor INT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    stockTotal INT DEFAULT 0,
    stockMin INT DEFAULT 10,
    CONSTRAINT chkStockTotal CHECK (stockTotal >= 0),
    FOREIGN KEY (idCategoria) REFERENCES Categorias(idCategoria),
    FOREIGN KEY (idProveedor) REFERENCES Proveedores(idProveedor)
);

-- Tabla de Almacenes para gestión multi-sucursal
CREATE TABLE Almacenes (
    idAlmacen INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

-- Tabla de Inventarios (Control por almacén)
CREATE TABLE Inventarios (
    idInventario INT AUTO_INCREMENT PRIMARY KEY,
    idProducto INT NOT NULL,
    idAlmacen INT NOT NULL,
    stockLocal INT DEFAULT 0,
    CONSTRAINT chkStockLocal CHECK (stockLocal >= 0),
    FOREIGN KEY (idProducto) REFERENCES Productos(idProducto),
    FOREIGN KEY (idAlmacen) REFERENCES Almacenes(idAlmacen),
    UNIQUE (idProducto, idAlmacen) 
);

-- Tabla de Movimientos con restricción de tipo
CREATE TABLE Movimientos (
    idMovimiento INT AUTO_INCREMENT PRIMARY KEY,
    idAlmacen INT NOT NULL,
    usuario VARCHAR(50) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    tipo VARCHAR(10) NOT NULL,
    CONSTRAINT chkTipoMovimiento CHECK (tipo IN ('entrada', 'salida')),
    FOREIGN KEY (idAlmacen) REFERENCES Almacenes(idAlmacen)
);

-- Detalle de los movimientos para auditoría
CREATE TABLE detalleMovimientos (
    idDetalle INT AUTO_INCREMENT PRIMARY KEY,
    idMovimiento INT NOT NULL,
    idProducto INT NOT NULL,
    cantidad INT NOT NULL,
    FOREIGN KEY (idMovimiento) REFERENCES Movimientos(idMovimiento),
    FOREIGN KEY (idProducto) REFERENCES Productos(idProducto)
);

-- ------------------------------------------------------------------------------
-- 2. ÍNDICES (Optimización y Justificación)
-- ------------------------------------------------------------------------------
-- Justificación: Acelera JOINs y filtros por categoría en consultas de productos.
-- Sin este índice, cada consulta filtrada por categoría haría un full table scan.
CREATE INDEX idxProductoCategoria ON Productos(idCategoria);

-- Justificación: Acelera JOINs y filtros por proveedor. Los reportes de inventario
-- frecuentemente agrupan o filtran productos por proveedor.
CREATE INDEX idxProductoProveedor ON Productos(idProveedor);

-- Justificación: La tabla Movimientos se consulta constantemente filtrada por almacén
-- (vista historial, consultas por sucursal). Este índice evita un full table scan.
CREATE INDEX idxMovimientoAlmacen ON Movimientos(idAlmacen);

-- ------------------------------------------------------------------------------
-- 3. VISTAS (Reportes de Análisis)
-- ------------------------------------------------------------------------------
-- Vista para el inventario actual detallado
CREATE VIEW vista_inventario_actual AS
SELECT p.nombre AS Producto, a.nombre AS Almacen, i.stockLocal, p.precio
FROM Inventarios i
JOIN Productos p ON i.idProducto = p.idProducto
JOIN Almacenes a ON i.idAlmacen = a.idAlmacen;

-- Vista para el historial de movimientos
CREATE VIEW vista_historial_movimientos AS
SELECT m.fecha, m.tipo, p.nombre AS Producto, d.cantidad, m.usuario, a.nombre AS Almacen
FROM Movimientos m
JOIN detalleMovimientos d ON m.idMovimiento = d.idMovimiento
JOIN Productos p ON d.idProducto = p.idProducto
JOIN Almacenes a ON m.idAlmacen = a.idAlmacen;

-- ------------------------------------------------------------------------------
-- 4. FUNCIONES (Lógica de Negocio)
-- ------------------------------------------------------------------------------
DELIMITER //

-- Función para clasificar el nivel de stock (REQUERIMIENTO: CASE)
CREATE FUNCTION fn_nivel_stock(p_idProd INT) 
RETURNS VARCHAR(10)
DETERMINISTIC
BEGIN
    DECLARE v_stock INT;
    DECLARE v_min INT;
    SELECT stockTotal, stockMin INTO v_stock, v_min FROM Productos WHERE idProducto = p_idProd;
    RETURN CASE 
        WHEN v_stock <= v_min THEN 'Bajo'
        WHEN v_stock <= v_min * 2 THEN 'Medio'
        ELSE 'Alto'
    END;
END //

-- Función para consultar el stock de un producto en un almacén específico
-- Resuelve: Permite obtener rápidamente el stock local sin hacer JOINs manuales.
-- Se utiliza en sp_consultar_inventario y en consultas directas.
CREATE FUNCTION fn_consultar_inventario(p_idProd INT, p_idAlm INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE v_stock INT;
    SELECT stockLocal INTO v_stock 
    FROM Inventarios 
    WHERE idProducto = p_idProd AND idAlmacen = p_idAlm;
    RETURN IFNULL(v_stock, 0);
END //

DELIMITER ;

-- ------------------------------------------------------------------------------
-- 5. TRIGGER (Control de Integridad)
-- ------------------------------------------------------------------------------
DELIMITER //

-- Evita stock negativo validando existencias antes de la salida
CREATE TRIGGER tr_evitar_stock_negativo
BEFORE INSERT ON detalleMovimientos
FOR EACH ROW
BEGIN
    DECLARE v_tipo VARCHAR(10);
    DECLARE v_actual INT;
    DECLARE v_alm INT;

    SELECT tipo, idAlmacen INTO v_tipo, v_alm FROM Movimientos WHERE idMovimiento = NEW.idMovimiento;

    IF v_tipo = 'salida' THEN
        SELECT stockLocal INTO v_actual FROM Inventarios 
        WHERE idProducto = NEW.idProducto AND idAlmacen = v_alm;
        
        IF v_actual < NEW.cantidad OR v_actual IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: No hay suficiente stock en este almacen.';
        END IF;
    END IF;
END //

DELIMITER ;

-- ------------------------------------------------------------------------------
-- 6. PROCEDIMIENTO Y TRANSACCIÓN (Registro Completo)
-- ------------------------------------------------------------------------------
DELIMITER //

CREATE PROCEDURE sp_registrar_movimiento_completo(
    IN p_alm INT, IN p_user VARCHAR(50), IN p_tipo VARCHAR(10), IN p_prod INT, IN p_cant INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; END;

    START TRANSACTION; --
        INSERT INTO Movimientos (idAlmacen, usuario, tipo) VALUES (p_alm, p_user, p_tipo);
        SET @last_id = LAST_INSERT_ID();
        
        INSERT INTO detalleMovimientos (idMovimiento, idProducto, cantidad) VALUES (@last_id, p_prod, p_cant);

        IF p_tipo = 'entrada' THEN
            UPDATE Inventarios SET stockLocal = stockLocal + p_cant WHERE idProducto = p_prod AND idAlmacen = p_alm;
            UPDATE Productos SET stockTotal = stockTotal + p_cant WHERE idProducto = p_prod;
        ELSE
            UPDATE Inventarios SET stockLocal = stockLocal - p_cant WHERE idProducto = p_prod AND idAlmacen = p_alm;
            UPDATE Productos SET stockTotal = stockTotal - p_cant WHERE idProducto = p_prod;
        END IF;
    COMMIT; --
END //

-- Procedimiento para consultar el inventario completo con nivel de stock
-- Resuelve: Genera un reporte integral del inventario usando fn_nivel_stock y fn_consultar_inventario,
-- facilitando la toma de decisiones sobre reabastecimiento.
CREATE PROCEDURE sp_consultar_inventario()
BEGIN
    SELECT 
        p.idProducto,
        p.nombre AS Producto,
        c.nombre AS Categoria,
        pr.nombre AS Proveedor,
        p.stockTotal,
        p.stockMin,
        fn_nivel_stock(p.idProducto) AS NivelStock,
        p.precio,
        (p.stockTotal * p.precio) AS ValorInventario
    FROM Productos p
    JOIN Categorias c ON p.idCategoria = c.idCategoria
    JOIN Proveedores pr ON p.idProveedor = pr.idProveedor
    ORDER BY p.stockTotal ASC;
END //

DELIMITER ;

-- ------------------------------------------------------------------------------
-- 7. SEGURIDAD (Usuarios y Roles)
-- ------------------------------------------------------------------------------
-- Rol Administrador (Todo)
CREATE ROLE IF NOT EXISTS 'admin_role';
GRANT ALL PRIVILEGES ON sistemaInventarios.* TO 'admin_role';

-- Rol Almacenista (Solo registrar movimientos y consultar productos)
CREATE ROLE IF NOT EXISTS 'almacenista_role';
GRANT EXECUTE ON PROCEDURE sistemaInventarios.sp_registrar_movimiento_completo TO 'almacenista_role';
GRANT EXECUTE ON PROCEDURE sistemaInventarios.sp_consultar_inventario TO 'almacenista_role';
GRANT SELECT ON sistemaInventarios.Productos TO 'almacenista_role';

-- Rol Supervisor (Solo consulta de vistas y procedimiento de consulta)
CREATE ROLE IF NOT EXISTS 'supervisor_role';
GRANT SELECT ON sistemaInventarios.vista_inventario_actual TO 'supervisor_role';
GRANT SELECT ON sistemaInventarios.vista_historial_movimientos TO 'supervisor_role';
GRANT EXECUTE ON PROCEDURE sistemaInventarios.sp_consultar_inventario TO 'supervisor_role';

-- Crear usuarios
CREATE USER IF NOT EXISTS 'admin_user'@'localhost' IDENTIFIED BY 'Admin123!';
CREATE USER IF NOT EXISTS 'almacen_user'@'localhost' IDENTIFIED BY 'Almacen123!';
CREATE USER IF NOT EXISTS 'super_user'@'localhost' IDENTIFIED BY 'Super123!';

-- Nota: en entornos virtualizados (WSL/VM/contenedor), MariaDB puede ver al cliente
-- con IP privada (por ejemplo 10.0.2.2) en lugar de localhost. Se crean estas cuentas
-- adicionales para que las pruebas de roles desde el backend no fallen por host.
CREATE USER IF NOT EXISTS 'admin_user'@'10.0.2.2' IDENTIFIED BY 'Admin123!';
CREATE USER IF NOT EXISTS 'almacen_user'@'10.0.2.2' IDENTIFIED BY 'Almacen123!';
CREATE USER IF NOT EXISTS 'super_user'@'10.0.2.2' IDENTIFIED BY 'Super123!';

-- Concedemos roles
GRANT 'admin_role' TO 'admin_user'@'localhost';
GRANT 'almacenista_role' TO 'almacen_user'@'localhost';
GRANT 'supervisor_role' TO 'super_user'@'localhost';

GRANT 'admin_role' TO 'admin_user'@'10.0.2.2';
GRANT 'almacenista_role' TO 'almacen_user'@'10.0.2.2';
GRANT 'supervisor_role' TO 'super_user'@'10.0.2.2';

-- Establecer el rol por defecto para cada usuario 
SET DEFAULT ROLE 'admin_role' FOR 'admin_user'@'localhost';
SET DEFAULT ROLE 'almacenista_role' FOR 'almacen_user'@'localhost';
SET DEFAULT ROLE 'supervisor_role' FOR 'super_user'@'localhost';

SET DEFAULT ROLE 'admin_role' FOR 'admin_user'@'10.0.2.2';
SET DEFAULT ROLE 'almacenista_role' FOR 'almacen_user'@'10.0.2.2';
SET DEFAULT ROLE 'supervisor_role' FOR 'super_user'@'10.0.2.2';

FLUSH PRIVILEGES;

-- ------------------------------------------------------------------------------
-- 8. DATOS DE PRUEBA (20+ inserts por tabla)
-- ------------------------------------------------------------------------------

-- Categorías (20 registros)
INSERT INTO Categorias (nombre) VALUES
('Electrónica'), ('Ropa'), ('Alimentos'), ('Hogar'), ('Deportes'),
('Juguetes'), ('Herramientas'), ('Oficina'), ('Jardín'), ('Automotriz'),
('Salud'), ('Belleza'), ('Mascotas'), ('Libros'), ('Tecnología'),
('Muebles'), ('Calzado'), ('Accesorios'), ('Limpieza'), ('Papelería');

-- Proveedores (20 registros)
INSERT INTO Proveedores (nombre, email, telefono) VALUES
('TechWorld', 'ventas@techworld.com', '4421001001'),
('ModaExpress', 'contacto@modaexpress.com', '4421001002'),
('AlimentosMX', 'pedidos@alimentosmx.com', '4421001003'),
('HogarPlus', 'info@hogarplus.com', '4421001004'),
('DeportTotal', 'ventas@deporttotal.com', '4421001005'),
('JugueteLand', 'compras@jugueteland.com', '4421001006'),
('FerreMas', 'contacto@ferremas.com', '4421001007'),
('OficinaYa', 'pedidos@oficinaya.com', '4421001008'),
('JardinVerde', 'ventas@jardinverde.com', '4421001009'),
('AutoPartes', 'info@autopartes.com', '4421001010'),
('SaludVital', 'contacto@saludvital.com', '4421001011'),
('BellezaPura', 'ventas@bellezapura.com', '4421001012'),
('PetHappy', 'info@pethappy.com', '4421001013'),
('LibroMundo', 'pedidos@libromundo.com', '4421001014'),
('InnoTech', 'ventas@innotech.com', '4421001015'),
('MueblesFinos', 'contacto@mueblesfinos.com', '4421001016'),
('CalzadoPro', 'info@calzadopro.com', '4421001017'),
('AccesoriosMX', 'ventas@accesoriosmx.com', '4421001018'),
('LimpiaMax', 'pedidos@limpiamax.com', '4421001019'),
('PapelYMas', 'contacto@papelmas.com', '4421001020');

-- Productos (20 registros, stockTotal inicia en 0, se actualiza con movimientos)
INSERT INTO Productos (nombre, idCategoria, idProveedor, precio, stockTotal, stockMin) VALUES
('Laptop HP 15"', 1, 1, 12500.00, 0, 5),
('Camiseta Polo', 2, 2, 350.00, 0, 20),
('Arroz Premium 1kg', 3, 3, 45.00, 0, 50),
('Sartén Antiadherente', 4, 4, 280.00, 0, 15),
('Balón de Fútbol', 5, 5, 450.00, 0, 10),
('Rompecabezas 1000pz', 6, 6, 220.00, 0, 10),
('Taladro Inalámbrico', 7, 7, 1800.00, 0, 8),
('Resma Papel A4', 8, 8, 120.00, 0, 30),
('Manguera 15m', 9, 9, 350.00, 0, 10),
('Aceite Motor 5W30', 10, 10, 280.00, 0, 15),
('Vitaminas C 100tab', 11, 11, 150.00, 0, 25),
('Shampoo Orgánico', 12, 12, 95.00, 0, 20),
('Croquetas Perro 10kg', 13, 13, 520.00, 0, 15),
('Novela Best Seller', 14, 14, 180.00, 0, 10),
('Mouse Inalámbrico', 15, 15, 250.00, 0, 20),
('Escritorio Madera', 16, 16, 3500.00, 0, 5),
('Tenis Running', 17, 17, 1200.00, 0, 12),
('Funda Celular', 18, 18, 85.00, 0, 30),
('Cloro 1L', 19, 19, 25.00, 0, 40),
('Cuaderno 100 hojas', 20, 20, 35.00, 0, 50);

-- Almacenes (20 registros)
INSERT INTO Almacenes (nombre) VALUES
('Almacén Central'), ('Almacén Norte'), ('Almacén Sur'),
('Almacén Este'), ('Almacén Oeste'), ('Bodega Principal'),
('Bodega Secundaria'), ('Centro Distribución A'), ('Centro Distribución B'),
('Centro Distribución C'), ('Sucursal Querétaro'), ('Sucursal CDMX'),
('Sucursal Guadalajara'), ('Sucursal Monterrey'), ('Sucursal Puebla'),
('Almacén Temporal 1'), ('Almacén Temporal 2'), ('Almacén Devoluciones'),
('Almacén Mayoreo'), ('Almacén Menudeo');

-- Inventarios (30 registros - combinaciones producto-almacén, stock inicia en 0)
-- Se inicializan en 0 porque el procedimiento sp_registrar_movimiento_completo actualiza el stock.
INSERT INTO Inventarios (idProducto, idAlmacen, stockLocal) VALUES
(1, 1, 0), (1, 2, 0), (2, 1, 0), (2, 3, 0), (3, 1, 0),
(3, 4, 0), (4, 1, 0), (4, 5, 0), (5, 2, 0), (5, 3, 0),
(6, 1, 0), (6, 6, 0), (7, 2, 0), (7, 7, 0), (8, 1, 0),
(8, 8, 0), (9, 3, 0), (9, 9, 0), (10, 1, 0), (10, 10, 0),
(11, 1, 0), (12, 2, 0), (13, 3, 0), (14, 4, 0), (15, 5, 0),
(16, 6, 0), (17, 7, 0), (18, 8, 0), (19, 9, 0), (20, 10, 0);

-- Movimientos y detalleMovimientos (36 registros cada tabla)
-- Se generan mediante el procedimiento sp_registrar_movimiento_completo.
-- Cada CALL ejecuta la transacción: INSERT movimiento + INSERT detalle + UPDATE stock.
-- Esto garantiza consistencia transaccional y demuestra el uso del procedimiento.

-- === Entradas de mercancía (30 movimientos) ===
CALL sp_registrar_movimiento_completo(1, 'admin_user', 'entrada', 1, 30);
CALL sp_registrar_movimiento_completo(2, 'admin_user', 'entrada', 1, 20);
CALL sp_registrar_movimiento_completo(1, 'almacen_user', 'entrada', 2, 50);
CALL sp_registrar_movimiento_completo(3, 'almacen_user', 'entrada', 2, 40);
CALL sp_registrar_movimiento_completo(1, 'admin_user', 'entrada', 3, 100);
CALL sp_registrar_movimiento_completo(4, 'almacen_user', 'entrada', 3, 80);
CALL sp_registrar_movimiento_completo(1, 'admin_user', 'entrada', 4, 35);
CALL sp_registrar_movimiento_completo(5, 'almacen_user', 'entrada', 4, 25);
CALL sp_registrar_movimiento_completo(2, 'admin_user', 'entrada', 5, 40);
CALL sp_registrar_movimiento_completo(3, 'almacen_user', 'entrada', 5, 30);
CALL sp_registrar_movimiento_completo(1, 'admin_user', 'entrada', 6, 45);
CALL sp_registrar_movimiento_completo(6, 'almacen_user', 'entrada', 6, 20);
CALL sp_registrar_movimiento_completo(2, 'admin_user', 'entrada', 7, 25);
CALL sp_registrar_movimiento_completo(7, 'almacen_user', 'entrada', 7, 15);
CALL sp_registrar_movimiento_completo(1, 'admin_user', 'entrada', 8, 60);
CALL sp_registrar_movimiento_completo(8, 'almacen_user', 'entrada', 8, 40);
CALL sp_registrar_movimiento_completo(3, 'admin_user', 'entrada', 9, 30);
CALL sp_registrar_movimiento_completo(9, 'almacen_user', 'entrada', 9, 20);
CALL sp_registrar_movimiento_completo(1, 'admin_user', 'entrada', 10, 40);
CALL sp_registrar_movimiento_completo(10, 'almacen_user', 'entrada', 10, 25);
CALL sp_registrar_movimiento_completo(1, 'admin_user', 'entrada', 11, 50);
CALL sp_registrar_movimiento_completo(2, 'almacen_user', 'entrada', 12, 35);
CALL sp_registrar_movimiento_completo(3, 'admin_user', 'entrada', 13, 30);
CALL sp_registrar_movimiento_completo(4, 'almacen_user', 'entrada', 14, 25);
CALL sp_registrar_movimiento_completo(5, 'admin_user', 'entrada', 15, 45);
CALL sp_registrar_movimiento_completo(6, 'almacen_user', 'entrada', 16, 15);
CALL sp_registrar_movimiento_completo(7, 'admin_user', 'entrada', 17, 30);
CALL sp_registrar_movimiento_completo(8, 'almacen_user', 'entrada', 18, 55);
CALL sp_registrar_movimiento_completo(9, 'admin_user', 'entrada', 19, 70);
CALL sp_registrar_movimiento_completo(10, 'almacen_user', 'entrada', 20, 90);

-- === Salidas de mercancía (6 movimientos) ===
CALL sp_registrar_movimiento_completo(1, 'almacen_user', 'salida', 1, 5);
CALL sp_registrar_movimiento_completo(1, 'almacen_user', 'salida', 2, 10);
CALL sp_registrar_movimiento_completo(1, 'admin_user', 'salida', 3, 15);
CALL sp_registrar_movimiento_completo(2, 'almacen_user', 'salida', 5, 8);
CALL sp_registrar_movimiento_completo(1, 'admin_user', 'salida', 6, 12);
CALL sp_registrar_movimiento_completo(2, 'almacen_user', 'salida', 7, 5);

-- ------------------------------------------------------------------------------
-- 9. CONSULTAS REQUERIDAS
-- ------------------------------------------------------------------------------

-- Consulta 1: Stock actual por producto calculado desde movimientos (SUM entradas - salidas)
SELECT 
    p.idProducto,
    p.nombre AS Producto,
    COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN d.cantidad ELSE 0 END), 0) AS TotalEntradas,
    COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN d.cantidad ELSE 0 END), 0) AS TotalSalidas,
    COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN d.cantidad ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN d.cantidad ELSE 0 END), 0) AS StockCalculado
FROM Productos p
LEFT JOIN detalleMovimientos d ON p.idProducto = d.idProducto
LEFT JOIN Movimientos m ON d.idMovimiento = m.idMovimiento
GROUP BY p.idProducto, p.nombre;

-- Consulta 2: Productos con stock menor al promedio (subconsulta)
SELECT p.idProducto, p.nombre, p.stockTotal, fn_nivel_stock(p.idProducto) AS NivelStock
FROM Productos p
WHERE p.stockTotal < (SELECT AVG(stockTotal) FROM Productos)
ORDER BY p.stockTotal ASC;

-- Consulta 3: Movimientos por almacén
SELECT 
    a.nombre AS Almacen, 
    m.idMovimiento, m.fecha, m.tipo, m.usuario,
    p.nombre AS Producto, d.cantidad
FROM Movimientos m
JOIN Almacenes a ON m.idAlmacen = a.idAlmacen
JOIN detalleMovimientos d ON m.idMovimiento = d.idMovimiento
JOIN Productos p ON d.idProducto = p.idProducto
ORDER BY a.nombre, m.fecha;

-- Consulta 4: Productos con mayor movimiento (usa HAVING para filtrar los que tienen más de 1 movimiento)
SELECT 
    p.idProducto, p.nombre,
    COUNT(d.idDetalle) AS TotalMovimientos,
    SUM(d.cantidad) AS CantidadTotalMovida
FROM Productos p
JOIN detalleMovimientos d ON p.idProducto = d.idProducto
GROUP BY p.idProducto, p.nombre
HAVING COUNT(d.idDetalle) > 1
ORDER BY TotalMovimientos DESC, CantidadTotalMovida DESC;

-- ------------------------------------------------------------------------------
-- 10. DEMOSTRACIÓN DE USO DE FUNCIONES
-- ------------------------------------------------------------------------------
-- REQUERIMIENTO: "Todas las funciones deben ser utilizadas al menos en una consulta,
-- una vista o un procedimiento."

-- Uso de fn_nivel_stock en consulta directa (también se usa en sp_consultar_inventario)
SELECT idProducto, nombre, stockTotal, fn_nivel_stock(idProducto) AS NivelStock 
FROM Productos;

-- Uso de fn_consultar_inventario en consulta directa
SELECT fn_consultar_inventario(1, 1) AS Stock_Prod1_Alm1;

-- Uso de fn_consultar_inventario para ver stock de todos los productos en Almacén Central
SELECT 
    p.idProducto, p.nombre,
    fn_consultar_inventario(p.idProducto, 1) AS StockEnCentral
FROM Productos p
WHERE fn_consultar_inventario(p.idProducto, 1) > 0;

-- Uso de ambas funciones en el procedimiento sp_consultar_inventario
CALL sp_consultar_inventario();