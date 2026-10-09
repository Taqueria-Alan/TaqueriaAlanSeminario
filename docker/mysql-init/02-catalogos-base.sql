-- =====================================================================
-- Catalogos base de Taqueria Alan: datos que el CODIGO da por existentes
-- y que deben cargarse en la base ANTES de usar la aplicacion.
--
-- * Se puede ejecutar varias veces: inserta solo lo que falta.
-- * Usa ids FIJOS (ver tabla de abajo). Si una fila con ese id, o con ese
--   nombre pero otro id, ya existe y no coincide, el script se detiene con
--   un mensaje claro en lugar de dejar la base inconsistente.
-- * No modifica datos existentes.
-- * Requiere el esquema de docker/mysql-init/01-schema*.sql ya creado y
--   permiso CREATE ROUTINE (crea y borra un procedimiento temporal).
--
-- Constantes que el backend/front pueden referenciar:
--
--   TIPO_PEDIDO.id_tipo_pedido = 1    'Normal'
--   TIPO_PEDIDO.id_tipo_pedido = 2    'Suscripción Club Alan'
--   CATEGORIA.id_categoria     = 100  'Servicios'          (productos que no son comida)
--   PRODUCTO.id_producto       = 1    'Membresía Club Alan' (lo que vende la suscripcion)
--
-- El id 100 de CATEGORIA esta reservado para filas del sistema: el
-- AUTO_INCREMENT de CATEGORIA continuara desde 101 si la tabla estaba vacia.
-- PRODUCTO usa el id 1 (el primero de la tabla), asi que su AUTO_INCREMENT
-- continuara desde 2 para el resto del catalogo (tacos, gringas, etc.).
-- El front busca la categoria por nombre ('Servicios') y el producto por nombre
-- ('Club Alan' o 'Membresía'), asi que coincide con estas filas.
--
-- Como ejecutarlo contra el MySQL de docker-compose (contenedor taqueria-mysql):
--   docker cp docker/mysql-init/02-catalogos-base.sql taqueria-mysql:/tmp/02-catalogos-base.sql
--   docker exec taqueria-mysql sh -c "mysql -uroot -p<ROOT_PASSWORD> --default-character-set=utf8mb4 < /tmp/02-catalogos-base.sql"
-- =====================================================================

SET NAMES utf8mb4;

-- Los servicios usan taqueria_db por defecto. Si usas el esquema local
-- (01-schema.sql), cambia a: USE TaqueriaAlanDB;
USE taqueria_db;

-- ---------------------------------------------------------------------
-- VALORES: cambialos solo si el codigo usa otros.
-- ---------------------------------------------------------------------
SET @ID_TIPO_NORMAL        = 1;
SET @ID_TIPO_SUSCRIPCION   = 2;
SET @ID_CATEGORIA_SERVICIOS = 100;
SET @ID_PRODUCTO_CLUB      = 1;

SET @TIPO_NORMAL           = 'Normal';
SET @TIPO_SUSCRIPCION      = 'Suscripción Club Alan';
SET @CATEGORIA_SERVICIOS   = 'Servicios';
SET @PRODUCTO_CLUB         = 'Membresía Club Alan';

-- Precio inicial de la membresia (valor de ejemplo; se cambia luego desde el panel Menu).
SET @PRECIO_CLUB           = 10.00;

-- Primer administrador. IMPORTANTE: el hash corresponde a la contrasena de
-- demostracion 'Admin1234' (BCrypt). Reemplazalo por el hash de una contrasena
-- propia antes de usar la base fuera de pruebas.
SET @ADMIN_EMAIL           = 'admin@taqueriaalan.com';
SET @ADMIN_NOMBRE          = 'Administrador Taquería Alan';
SET @ADMIN_ROL             = 'ADMIN';
SET @ADMIN_HASH            = '$2a$10$t.4e/rnfCKXwg7q0PwylROEhnR7eaay8kP/MNe8ohuPYo4pHTuo0q';

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_catalogos_base$$

CREATE PROCEDURE sp_catalogos_base()
BEGIN
  DECLARE v_texto VARCHAR(255);
  DECLARE v_otro  INT;

  -- ---- TIPO_PEDIDO: Normal ---------------------------------------------
  SET v_texto = NULL;
  SELECT MAX(descripcion) INTO v_texto FROM TIPO_PEDIDO WHERE id_tipo_pedido = @ID_TIPO_NORMAL;
  IF v_texto IS NULL THEN
    SET v_otro = NULL;
    SELECT MAX(id_tipo_pedido) INTO v_otro FROM TIPO_PEDIDO WHERE descripcion = @TIPO_NORMAL;
    IF v_otro IS NOT NULL THEN
      SET v_texto = CONCAT('TIPO_PEDIDO "', @TIPO_NORMAL, '" ya existe con id ', v_otro, '; se esperaba ', @ID_TIPO_NORMAL);
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_texto;
    END IF;
    INSERT INTO TIPO_PEDIDO (id_tipo_pedido, descripcion) VALUES (@ID_TIPO_NORMAL, @TIPO_NORMAL);
  ELSEIF v_texto <> @TIPO_NORMAL THEN
    SET v_texto = CONCAT('TIPO_PEDIDO id ', @ID_TIPO_NORMAL, ' lo usa "', LEFT(v_texto, 30), '"; se esperaba "', @TIPO_NORMAL, '"');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_texto;
  END IF;

  -- ---- TIPO_PEDIDO: Suscripcion ----------------------------------------
  SET v_texto = NULL;
  SELECT MAX(descripcion) INTO v_texto FROM TIPO_PEDIDO WHERE id_tipo_pedido = @ID_TIPO_SUSCRIPCION;
  IF v_texto IS NULL THEN
    SET v_otro = NULL;
    SELECT MAX(id_tipo_pedido) INTO v_otro FROM TIPO_PEDIDO WHERE descripcion = @TIPO_SUSCRIPCION;
    IF v_otro IS NOT NULL THEN
      SET v_texto = CONCAT('TIPO_PEDIDO "', @TIPO_SUSCRIPCION, '" ya existe con id ', v_otro, '; se esperaba ', @ID_TIPO_SUSCRIPCION);
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_texto;
    END IF;
    INSERT INTO TIPO_PEDIDO (id_tipo_pedido, descripcion) VALUES (@ID_TIPO_SUSCRIPCION, @TIPO_SUSCRIPCION);
  ELSEIF v_texto <> @TIPO_SUSCRIPCION THEN
    SET v_texto = CONCAT('TIPO_PEDIDO id ', @ID_TIPO_SUSCRIPCION, ' lo usa "', LEFT(v_texto, 30), '"; se esperaba "', @TIPO_SUSCRIPCION, '"');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_texto;
  END IF;

  -- ---- CATEGORIA: Servicios --------------------------------------------
  SET v_texto = NULL;
  SELECT MAX(nombre) INTO v_texto FROM CATEGORIA WHERE id_categoria = @ID_CATEGORIA_SERVICIOS;
  IF v_texto IS NULL THEN
    SET v_otro = NULL;
    SELECT MAX(id_categoria) INTO v_otro FROM CATEGORIA WHERE nombre = @CATEGORIA_SERVICIOS;
    IF v_otro IS NOT NULL THEN
      SET v_texto = CONCAT('CATEGORIA "', @CATEGORIA_SERVICIOS, '" ya existe con id ', v_otro, '; se esperaba ', @ID_CATEGORIA_SERVICIOS);
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_texto;
    END IF;
    INSERT INTO CATEGORIA (id_categoria, nombre, descripcion, activa)
    VALUES (@ID_CATEGORIA_SERVICIOS, @CATEGORIA_SERVICIOS,
            'Productos de servicio (no son comida), como la membresía del Club Alan', 1);
  ELSEIF v_texto <> @CATEGORIA_SERVICIOS THEN
    SET v_texto = CONCAT('CATEGORIA id ', @ID_CATEGORIA_SERVICIOS, ' lo usa "', LEFT(v_texto, 30), '"; se esperaba "', @CATEGORIA_SERVICIOS, '"');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_texto;
  END IF;

  -- ---- PRODUCTO: Membresia Club Alan -----------------------------------
  SET v_texto = NULL;
  SELECT MAX(nombre) INTO v_texto FROM PRODUCTO WHERE id_producto = @ID_PRODUCTO_CLUB;
  IF v_texto IS NULL THEN
    SET v_otro = NULL;
    SELECT MAX(id_producto) INTO v_otro FROM PRODUCTO
    WHERE id_categoria = @ID_CATEGORIA_SERVICIOS AND nombre = @PRODUCTO_CLUB;
    IF v_otro IS NOT NULL THEN
      SET v_texto = CONCAT('PRODUCTO "', @PRODUCTO_CLUB, '" ya existe con id ', v_otro, '; se esperaba ', @ID_PRODUCTO_CLUB);
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_texto;
    END IF;
    INSERT INTO PRODUCTO (id_producto, id_categoria, nombre, descripcion, precio, disponible)
    VALUES (@ID_PRODUCTO_CLUB, @ID_CATEGORIA_SERVICIOS, @PRODUCTO_CLUB,
            'Suscripción al Club Alan: puntos, canje y envío gratis', @PRECIO_CLUB, 1);
  ELSEIF v_texto <> @PRODUCTO_CLUB THEN
    SET v_texto = CONCAT('PRODUCTO id ', @ID_PRODUCTO_CLUB, ' lo usa "', LEFT(v_texto, 30), '"; se esperaba "', @PRODUCTO_CLUB, '"');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_texto;
  END IF;

  -- ---- USUARIO: primer administrador (se busca por correo) --------------
  IF NOT EXISTS (SELECT 1 FROM USUARIO WHERE email = @ADMIN_EMAIL) THEN
    INSERT INTO USUARIO (nombre, email, telefono, password_hash, rol)
    VALUES (@ADMIN_NOMBRE, @ADMIN_EMAIL, NULL, @ADMIN_HASH, @ADMIN_ROL);
  END IF;
END$$

DELIMITER ;

CALL sp_catalogos_base();
DROP PROCEDURE sp_catalogos_base;

-- ---------------------------------------------------------------------
-- Resultado: estas filas deben existir con estos ids
-- ---------------------------------------------------------------------
SELECT 'TIPO_PEDIDO' AS tabla, id_tipo_pedido AS id, descripcion AS nombre
FROM TIPO_PEDIDO WHERE id_tipo_pedido IN (@ID_TIPO_NORMAL, @ID_TIPO_SUSCRIPCION)
UNION ALL
SELECT 'CATEGORIA', id_categoria, nombre FROM CATEGORIA WHERE id_categoria = @ID_CATEGORIA_SERVICIOS
UNION ALL
SELECT 'PRODUCTO', id_producto, CONCAT(nombre, ' (Q', precio, ')') FROM PRODUCTO WHERE id_producto = @ID_PRODUCTO_CLUB
UNION ALL
SELECT 'USUARIO', id_usuario, email FROM USUARIO WHERE email = @ADMIN_EMAIL;
