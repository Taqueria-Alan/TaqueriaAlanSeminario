-- =====================================================================
-- TaqueriaAlanDB - Script para Azure Database for MySQL (Flexible Server)
-- Convertido desde SQL Server (T-SQL) a MySQL 8.0
-- Incluye las tablas MEMBRESIA y TIPO_PEDIDO del diagrama ER.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS TaqueriaAlanDB
  CHARACTER SET utf8mb4;

USE TaqueriaAlanDB;

-- ---------------------------------------------------------------------
-- TABLAS
-- ---------------------------------------------------------------------

CREATE TABLE USUARIO (
  id_usuario    INT NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL,
  telefono      VARCHAR(20)  NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol           VARCHAR(30)  NOT NULL,
  PRIMARY KEY (id_usuario),
  UNIQUE KEY UQ_USUARIO_email (email)
) ENGINE=InnoDB;

CREATE TABLE CLIENTE (
  id_cliente       INT NOT NULL AUTO_INCREMENT,
  id_usuario       INT NOT NULL,
  puntos_club_alan INT NOT NULL DEFAULT 0,
  miembro_club     TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id_cliente),
  UNIQUE KEY UQ_CLIENTE_usuario (id_usuario),
  CONSTRAINT FK_CLIENTE_USUARIO FOREIGN KEY (id_usuario)
    REFERENCES USUARIO (id_usuario)
) ENGINE=InnoDB;

CREATE TABLE REPARTIDOR (
  id_repartidor INT NOT NULL AUTO_INCREMENT,
  id_usuario    INT NOT NULL,
  disponible    TINYINT(1) NOT NULL DEFAULT 1,
  estado        VARCHAR(20) NOT NULL,
  PRIMARY KEY (id_repartidor),
  UNIQUE KEY UQ_REPARTIDOR_usuario (id_usuario),
  CONSTRAINT FK_REPARTIDOR_USUARIO FOREIGN KEY (id_usuario)
    REFERENCES USUARIO (id_usuario)
) ENGINE=InnoDB;

-- Del diagrama ER (no estaba en el script original). Tipos de dato supuestos.
CREATE TABLE TIPO_PEDIDO (
  id_tipo_pedido INT NOT NULL AUTO_INCREMENT,
  descripcion    VARCHAR(100) NOT NULL,
  PRIMARY KEY (id_tipo_pedido)
) ENGINE=InnoDB;

-- Del diagrama ER (no estaba en el script original). Tipos de dato supuestos.
CREATE TABLE MEMBRESIA (
  id_membresia INT NOT NULL AUTO_INCREMENT,
  id_cliente   INT NOT NULL,
  envio_gratis TINYINT(1) NOT NULL DEFAULT 0,
  fecha_inicio DATE NOT NULL,
  fecha_fin    DATE NULL,
  PRIMARY KEY (id_membresia),
  CONSTRAINT FK_MEMBRESIA_CLIENTE FOREIGN KEY (id_cliente)
    REFERENCES CLIENTE (id_cliente)
) ENGINE=InnoDB;

CREATE TABLE CATEGORIA (
  id_categoria INT NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(100) NOT NULL,
  descripcion  VARCHAR(255) NULL,
  activa       TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_categoria)
) ENGINE=InnoDB;

CREATE TABLE PRODUCTO (
  id_producto  INT NOT NULL AUTO_INCREMENT,
  id_categoria INT NOT NULL,
  nombre       VARCHAR(100) NOT NULL,
  descripcion  VARCHAR(255) NULL,
  precio       DECIMAL(10,2) NOT NULL,
  disponible   TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_producto),
  CONSTRAINT FK_PRODUCTO_CATEGORIA FOREIGN KEY (id_categoria)
    REFERENCES CATEGORIA (id_categoria)
) ENGINE=InnoDB;

CREATE TABLE PEDIDO (
  id_pedido         INT NOT NULL AUTO_INCREMENT,
  id_cliente        INT NOT NULL,
  id_repartidor     INT NULL,
  fecha_hora        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado            VARCHAR(30) NOT NULL,
  modalidad         VARCHAR(20) NOT NULL,
  total             DECIMAL(10,2) NOT NULL,
  direccion_entrega VARCHAR(255) NULL,
  observaciones     VARCHAR(255) NULL,
  id_tipo_pedido    INT NULL,
  PRIMARY KEY (id_pedido),
  CONSTRAINT FK_PEDIDO_CLIENTE FOREIGN KEY (id_cliente)
    REFERENCES CLIENTE (id_cliente),
  CONSTRAINT FK_PEDIDO_REPARTIDOR FOREIGN KEY (id_repartidor)
    REFERENCES REPARTIDOR (id_repartidor),
  CONSTRAINT FK_PEDIDO_TIPO_PEDIDO FOREIGN KEY (id_tipo_pedido)
    REFERENCES TIPO_PEDIDO (id_tipo_pedido)
) ENGINE=InnoDB;

CREATE TABLE DETALLE_PEDIDO (
  id_detalle      INT NOT NULL AUTO_INCREMENT,
  id_pedido       INT NOT NULL,
  id_producto     INT NOT NULL,
  cantidad        INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  observaciones   VARCHAR(255) NULL,
  PRIMARY KEY (id_detalle),
  CONSTRAINT FK_DETALLE_PEDIDO FOREIGN KEY (id_pedido)
    REFERENCES PEDIDO (id_pedido),
  CONSTRAINT FK_DETALLE_PRODUCTO FOREIGN KEY (id_producto)
    REFERENCES PRODUCTO (id_producto)
) ENGINE=InnoDB;

CREATE TABLE MOVIMIENTO_PUNTOS (
  id_movimiento INT NOT NULL AUTO_INCREMENT,
  id_cliente    INT NOT NULL,
  id_pedido     INT NULL,
  tipo          VARCHAR(20) NOT NULL,
  puntos        INT NOT NULL,
  fecha         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  descripcion   VARCHAR(255) NULL,
  PRIMARY KEY (id_movimiento),
  CONSTRAINT FK_MOVIMIENTO_CLIENTE FOREIGN KEY (id_cliente)
    REFERENCES CLIENTE (id_cliente),
  CONSTRAINT FK_MOVIMIENTO_PEDIDO FOREIGN KEY (id_pedido)
    REFERENCES PEDIDO (id_pedido)
) ENGINE=InnoDB;

CREATE TABLE PAGO (
  id_pago     INT NOT NULL AUTO_INCREMENT,
  id_pedido   INT NOT NULL,
  fecha_pago  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  monto       DECIMAL(10,2) NOT NULL,
  metodo_pago VARCHAR(30) NOT NULL,
  estado_pago VARCHAR(20) NOT NULL,
  referencia  VARCHAR(100) NULL,
  PRIMARY KEY (id_pago),
  CONSTRAINT FK_PAGO_PEDIDO FOREIGN KEY (id_pedido)
    REFERENCES PEDIDO (id_pedido)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- VISTAS
-- ---------------------------------------------------------------------

CREATE OR REPLACE VIEW vw_PedidosClientes AS
SELECT
  P.id_pedido,
  C.id_cliente,
  U.nombre AS nombre_cliente,
  P.fecha_hora,
  P.estado,
  P.modalidad,
  P.total,
  P.direccion_entrega,
  P.observaciones
FROM PEDIDO P
INNER JOIN CLIENTE C ON P.id_cliente = C.id_cliente
INNER JOIN USUARIO U ON C.id_usuario = U.id_usuario;

CREATE OR REPLACE VIEW vw_ProductosCategorias AS
SELECT
  P.id_producto,
  P.nombre AS nombre_producto,
  C.nombre AS categoria,
  P.descripcion,
  P.precio,
  P.disponible
FROM PRODUCTO P
INNER JOIN CATEGORIA C ON P.id_categoria = C.id_categoria;

-- ---------------------------------------------------------------------
-- FUNCIONES, PROCEDIMIENTOS Y TRIGGERS
-- (requieren log_bin_trust_function_creators = ON en Azure)
-- ---------------------------------------------------------------------

DELIMITER $$

CREATE FUNCTION fn_CalcularPuntos(p_total DECIMAL(10,2))
RETURNS INT
DETERMINISTIC
BEGIN
  RETURN FLOOR(p_total / 10);
END$$

CREATE FUNCTION fn_CalcularSubtotal(p_cantidad INT, p_precio_unitario DECIMAL(10,2))
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
  RETURN p_cantidad * p_precio_unitario;
END$$

CREATE PROCEDURE sp_ConsultarPedidosCliente(IN p_id_cliente INT)
BEGIN
  SELECT
    id_pedido,
    id_cliente,
    id_repartidor,
    fecha_hora,
    estado,
    modalidad,
    total,
    direccion_entrega,
    observaciones,
    id_tipo_pedido
  FROM PEDIDO
  WHERE id_cliente = p_id_cliente
  ORDER BY fecha_hora DESC;
END$$

-- MySQL no admite valores por defecto en parametros: pasar NULL cuando no aplique.
CREATE PROCEDURE sp_RegistrarPedido(
  IN p_id_cliente        INT,
  IN p_id_repartidor     INT,
  IN p_estado            VARCHAR(30),
  IN p_modalidad         VARCHAR(20),
  IN p_total             DECIMAL(10,2),
  IN p_direccion_entrega VARCHAR(255),
  IN p_observaciones     VARCHAR(255),
  IN p_id_tipo_pedido    INT
)
BEGIN
  INSERT INTO PEDIDO
    (id_cliente, id_repartidor, estado, modalidad, total,
     direccion_entrega, observaciones, id_tipo_pedido)
  VALUES
    (p_id_cliente, p_id_repartidor, p_estado, p_modalidad, p_total,
     p_direccion_entrega, p_observaciones, p_id_tipo_pedido);
END$$

-- Suma los puntos al cliente cada vez que se registra un movimiento
CREATE TRIGGER trg_ActualizarPuntosCliente
AFTER INSERT ON MOVIMIENTO_PUNTOS
FOR EACH ROW
BEGIN
  UPDATE CLIENTE
  SET puntos_club_alan = puntos_club_alan + NEW.puntos
  WHERE id_cliente = NEW.id_cliente;
END$$

-- MySQL necesita un trigger por evento (INSERT y UPDATE por separado)
CREATE TRIGGER trg_RepartidorNoDisponible_ins
AFTER INSERT ON PEDIDO
FOR EACH ROW
BEGIN
  IF NEW.id_repartidor IS NOT NULL THEN
    UPDATE REPARTIDOR
    SET disponible = 0, estado = 'OCUPADO'
    WHERE id_repartidor = NEW.id_repartidor;
  END IF;
END$$

CREATE TRIGGER trg_RepartidorNoDisponible_upd
AFTER UPDATE ON PEDIDO
FOR EACH ROW
BEGIN
  IF NEW.id_repartidor IS NOT NULL THEN
    UPDATE REPARTIDOR
    SET disponible = 0, estado = 'OCUPADO'
    WHERE id_repartidor = NEW.id_repartidor;
  END IF;
END$$

DELIMITER ;
