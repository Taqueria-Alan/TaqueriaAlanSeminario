-- =====================================================================
-- Datos de DEMOSTRACION para Taqueria Alan (frontend con datos reales)
--
-- Ejecutar DESPUES de 02-catalogos-base.sql (catalogos obligatorios con ids fijos).
--
-- * Se puede ejecutar varias veces: cada bloque inserta solo lo que falta
--   (busca por correo, nombre o la marca 'seed:' en PEDIDO.observaciones).
-- * No borra ni modifica datos que ya existan.
-- * Requiere el esquema de docker/mysql-init/01-schema*.sql ya creado.
--
-- Como ejecutarlo contra el MySQL de docker-compose (contenedor taqueria-mysql):
--   docker cp docker/mysql-init/03-datos-demo.sql taqueria-mysql:/tmp/03-datos-demo.sql
--   docker exec taqueria-mysql sh -c "mysql -uroot -p<ROOT_PASSWORD> --default-character-set=utf8mb4 < /tmp/03-datos-demo.sql"
--
-- Contrasena de TODOS los usuarios de ejemplo: Admin1234  (hash BCrypt, 10 rondas).
-- =====================================================================

SET NAMES utf8mb4;

-- Los servicios usan taqueria_db por defecto. Si usas el esquema local
-- (01-schema.sql), cambia a: USE TaqueriaAlanDB;
USE taqueria_db;

-- ---------------------------------------------------------------------
-- VALORES ASUMIDOS: las columnas son VARCHAR libres y el back aun no
-- define estos textos. Si el back usa otros, cambialos solo aqui.
-- ---------------------------------------------------------------------
SET @ROL_ADMIN       = 'ADMIN';
SET @ROL_CLIENTE     = 'CLIENTE';
SET @ROL_REPARTIDOR  = 'REPARTIDOR';

SET @EST_RECIBIDO    = 'RECIBIDO';
SET @EST_PREPARACION = 'EN_PREPARACION';
SET @EST_RUTA        = 'EN_RUTA';
SET @EST_ENTREGADO   = 'ENTREGADO';

SET @MOD_LLEVAR      = 'LLEVAR';
SET @MOD_DOMICILIO   = 'DOMICILIO';

SET @REP_DISPONIBLE  = 'DISPONIBLE';

SET @PAGO_PAGADO     = 'PAGADO';
SET @PAGO_EFECTIVO   = 'EFECTIVO';
SET @PAGO_TARJETA    = 'TARJETA';

SET @CAT_SERVICIOS   = 'Servicios';
SET @PRODUCTO_CLUB   = 'Membresía Club Alan';
SET @TIPO_NORMAL     = 'Normal';
SET @TIPO_SUSCRIP    = 'Suscripción Club Alan';

SET @HASH = '$2a$10$t.4e/rnfCKXwg7q0PwylROEhnR7eaay8kP/MNe8ohuPYo4pHTuo0q';

-- ---------------------------------------------------------------------
-- Guardia: si faltan los catalogos base el script se detiene aqui.
-- ---------------------------------------------------------------------
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_requiere_catalogos_base$$
CREATE PROCEDURE sp_requiere_catalogos_base()
BEGIN
  IF (SELECT COUNT(*) FROM TIPO_PEDIDO WHERE descripcion IN (@TIPO_NORMAL, @TIPO_SUSCRIP)) < 2
     OR NOT EXISTS (SELECT 1 FROM CATEGORIA WHERE nombre = @CAT_SERVICIOS)
     OR NOT EXISTS (SELECT 1 FROM PRODUCTO WHERE nombre = @PRODUCTO_CLUB) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Faltan catalogos base: ejecuta primero 02-catalogos-base.sql';
  END IF;
END$$
DELIMITER ;
CALL sp_requiere_catalogos_base();
DROP PROCEDURE sp_requiere_catalogos_base;

-- ---------------------------------------------------------------------
-- CATEGORIA
-- ---------------------------------------------------------------------
INSERT INTO CATEGORIA (nombre, descripcion, activa)
SELECT v.nombre, v.descripcion, 1
FROM (VALUES
  ROW('Tacos',                 'Tacos de pastor, pollo, chorizo, longaniza, res y adobado'),
  ROW('Gringas',               'Gringas en tortilla de harina con queso'),
  ROW('Tortillas de harina',   'Tortillas de harina rellenas'),
  ROW('Tortas y hamburguesas', 'Tortas mexicanas y hamburguesa de la casa')
) AS v (nombre, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM CATEGORIA c WHERE c.nombre = v.nombre);

-- ---------------------------------------------------------------------
-- PRODUCTO: menu oficial (el producto de la membresia lo crea 02-catalogos-base.sql)
-- ---------------------------------------------------------------------
INSERT INTO PRODUCTO (id_categoria, nombre, descripcion, precio, disponible)
SELECT c.id_categoria, v.nombre, v.descripcion, v.precio, 1
FROM (VALUES
  ROW('Tacos',                 '3 Tacos',                  'Pastor, pollo, chorizo, longaniza o 2 carnes', 18.00),
  ROW('Tacos',                 '3 Tacos',                  'Res y adobado',                                24.00),
  ROW('Tacos',                 '4 Tacos',                  'Pastor, pollo, chorizo, longaniza o 2 carnes', 24.00),
  ROW('Tacos',                 '4 Tacos',                  'Res y adobado',                                30.00),
  ROW('Gringas',               'Pequeña',                  'Pastor, pollo, chorizo, longaniza o 2 carnes', 12.00),
  ROW('Gringas',               'Super',                    'Res, adobado o mixto',                         24.00),
  ROW('Gringas',               'Jumbo',                    'Res, adobado o mixto',                         40.00),
  ROW('Gringas',               'Porción de 3 pequeñas',    'Res, adobado o mixto',                         40.00),
  ROW('Tortillas de harina',   'Pequeña',                  'Pastor, pollo, chorizo, longaniza o 2 carnes', 18.00),
  ROW('Tortillas de harina',   'Normal',                   'Res, adobado o mixto',                         30.00),
  ROW('Tortillas de harina',   'Gigante',                  'Res, adobado o mixto',                         40.00),
  ROW('Tortas y hamburguesas', 'Torta de embutidos',       'Pan horneado, guarniciones frescas',           18.00),
  ROW('Tortas y hamburguesas', 'Torta de carne especial',  'Pan horneado, guarniciones frescas',           25.00),
  ROW('Tortas y hamburguesas', 'Hamburguesa',              'Carne especial de la casa',                    16.00)
) AS v (categoria, nombre, descripcion, precio)
JOIN CATEGORIA c ON c.nombre = v.categoria
WHERE NOT EXISTS (
  SELECT 1 FROM PRODUCTO p
  WHERE p.id_categoria = c.id_categoria AND p.nombre = v.nombre AND p.descripcion = v.descripcion
);

-- ---------------------------------------------------------------------
-- USUARIO: 9 clientes y 2 repartidores (el administrador lo crea 02-catalogos-base.sql)
-- (los de ejemplo usan el dominio @seed.local para poder reconocerlos)
-- ---------------------------------------------------------------------
INSERT INTO USUARIO (nombre, email, telefono, password_hash, rol)
SELECT v.nombre, v.email, v.telefono, @HASH, v.rol
FROM (VALUES
  ROW('Ana Martínez',                'ana.martinez@seed.local',    '55510001', @ROL_CLIENTE),
  ROW('Luis Pérez',                  'luis.perez@seed.local',      '55510002', @ROL_CLIENTE),
  ROW('Marta Gómez',                 'marta.gomez@seed.local',     '55510003', @ROL_CLIENTE),
  ROW('Diego Ramírez',               'diego.ramirez@seed.local',   '55510004', @ROL_CLIENTE),
  ROW('Sofía López',                 'sofia.lopez@seed.local',     '55510005', @ROL_CLIENTE),
  ROW('Pablo Tzoc',                  'pablo.tzoc@seed.local',      '55510006', @ROL_CLIENTE),
  ROW('Rosa Cifuentes',              'rosa.cifuentes@seed.local',  '55510007', @ROL_CLIENTE),
  ROW('Jorge Valdez',                'jorge.valdez@seed.local',    '55510008', @ROL_CLIENTE),
  ROW('Elena Barrios',               'elena.barrios@seed.local',   '55510009', @ROL_CLIENTE),
  ROW('Carlos Mejía',                'carlos.mejia@seed.local',    '55520001', @ROL_REPARTIDOR),
  ROW('Roberto Chacón',              'roberto.chacon@seed.local',  '55520002', @ROL_REPARTIDOR)
) AS v (nombre, email, telefono, rol)
WHERE NOT EXISTS (SELECT 1 FROM USUARIO u WHERE u.email = v.email);

INSERT INTO CLIENTE (id_usuario, puntos_club_alan, miembro_club)
SELECT u.id_usuario, 0, 0
FROM USUARIO u
WHERE u.email LIKE '%@seed.local' AND u.rol = @ROL_CLIENTE
  AND NOT EXISTS (SELECT 1 FROM CLIENTE c WHERE c.id_usuario = u.id_usuario);

INSERT INTO REPARTIDOR (id_usuario, disponible, estado)
SELECT u.id_usuario, 1, @REP_DISPONIBLE
FROM USUARIO u
WHERE u.email LIKE '%@seed.local' AND u.rol = @ROL_REPARTIDOR
  AND NOT EXISTS (SELECT 1 FROM REPARTIDOR r WHERE r.id_usuario = u.id_usuario);

-- ---------------------------------------------------------------------
-- MEMBRESIA (Club Alan): 4 activas (fecha_fin NULL) y 1 cancelada
-- ---------------------------------------------------------------------
INSERT INTO MEMBRESIA (id_cliente, envio_gratis, fecha_inicio, fecha_fin)
SELECT c.id_cliente, 1, v.inicio, v.fin
FROM (VALUES
  ROW('ana.martinez@seed.local',  DATE_SUB(CURDATE(), INTERVAL 40 DAY), NULL),
  ROW('luis.perez@seed.local',    DATE_SUB(CURDATE(), INTERVAL 25 DAY), NULL),
  ROW('marta.gomez@seed.local',   DATE_SUB(CURDATE(), INTERVAL 12 DAY), NULL),
  ROW('diego.ramirez@seed.local', DATE_SUB(CURDATE(), INTERVAL 9 DAY),  NULL),
  ROW('sofia.lopez@seed.local',   DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_SUB(CURDATE(), INTERVAL 15 DAY))
) AS v (email, inicio, fin)
JOIN USUARIO u ON u.email = v.email
JOIN CLIENTE c ON c.id_usuario = u.id_usuario
WHERE NOT EXISTS (SELECT 1 FROM MEMBRESIA m WHERE m.id_cliente = c.id_cliente);

UPDATE CLIENTE c
JOIN USUARIO u ON u.id_usuario = c.id_usuario
SET c.miembro_club = 1
WHERE u.email IN ('ana.martinez@seed.local', 'luis.perez@seed.local',
                  'marta.gomez@seed.local', 'diego.ramirez@seed.local');

-- ---------------------------------------------------------------------
-- PEDIDO: 72 pedidos entregados (6 dias x 12) + 8 de hoy en distintos
-- estados. Las fechas son relativas a la fecha en que se ejecuta.
-- El total se calcula despues, con el detalle.
-- ---------------------------------------------------------------------
INSERT INTO PEDIDO (id_cliente, id_repartidor, fecha_hora, estado, modalidad, total,
                    direccion_entrega, observaciones, id_tipo_pedido)
SELECT
  cli.id_cliente,
  NULL,
  IF(n.i <= 72,
     TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL (6 - FLOOR((n.i - 1) / 12)) DAY),
               MAKETIME(19 + MOD(n.i, 3), MOD(n.i * 13, 60), 0)),
     DATE_SUB(NOW(), INTERVAL (81 - n.i) * 9 MINUTE)),
  CASE
    WHEN n.i <= 74 THEN @EST_ENTREGADO
    WHEN n.i <= 76 THEN @EST_PREPARACION
    WHEN n.i = 77  THEN @EST_RUTA
    ELSE @EST_RECIBIDO
  END,
  IF(MOD(n.i, 3) = 0 OR n.i IN (77, 79), @MOD_DOMICILIO, @MOD_LLEVAR),
  0,
  IF(MOD(n.i, 3) = 0 OR n.i IN (77, 79),
     CONCAT('Zona ', 1 + MOD(n.i, 18), ', Ciudad de Guatemala'), NULL),
  CONCAT('seed:', n.i),
  (SELECT t.id_tipo_pedido FROM TIPO_PEDIDO t WHERE t.descripcion = @TIPO_NORMAL LIMIT 1)
FROM (
  SELECT a.d + 10 * b.d + 1 AS i
  FROM (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a
  CROSS JOIN
       (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7) b
) n
JOIN (
  SELECT COUNT(*) AS k
  FROM CLIENTE c JOIN USUARIO u ON u.id_usuario = c.id_usuario
  WHERE u.email LIKE '%@seed.local'
) tot
JOIN (
  SELECT c.id_cliente, ROW_NUMBER() OVER (ORDER BY c.id_cliente) - 1 AS pos
  FROM CLIENTE c JOIN USUARIO u ON u.id_usuario = c.id_usuario
  WHERE u.email LIKE '%@seed.local'
) cli ON cli.pos = MOD(n.i * 7, tot.k)
WHERE n.i <= 80
  AND tot.k > 0
  AND NOT EXISTS (SELECT 1 FROM PEDIDO p WHERE p.observaciones REGEXP '^seed:[0-9]+$');

-- El pedido en ruta (seed:77) lleva repartidor. Se asigna con UPDATE y una variable porque
-- el trigger trg_RepartidorNoDisponible actualiza REPARTIDOR y MySQL no deja que la misma
-- sentencia lea esa tabla (error 1442).
SET @repartidor = (SELECT MIN(r.id_repartidor)
                   FROM REPARTIDOR r JOIN USUARIO ru ON ru.id_usuario = r.id_usuario
                   WHERE ru.email LIKE '%@seed.local');

UPDATE PEDIDO
SET id_repartidor = @repartidor
WHERE observaciones = 'seed:77' AND id_repartidor IS NULL AND @repartidor IS NOT NULL;

-- ---------------------------------------------------------------------
-- DETALLE_PEDIDO: de 1 a 3 productos de comida por pedido
-- ---------------------------------------------------------------------
INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, cantidad, precio_unitario, observaciones)
SELECT ped.id_pedido, prod.id_producto, 1 + MOD(ped.i + l.j, 2), prod.precio, NULL
FROM (
  SELECT id_pedido, CAST(SUBSTRING(observaciones, 6) AS UNSIGNED) AS i
  FROM PEDIDO
  WHERE observaciones REGEXP '^seed:[0-9]+$'
) ped
JOIN (SELECT 1 AS j UNION ALL SELECT 2 UNION ALL SELECT 3) l ON l.j <= 1 + MOD(ped.i, 3)
JOIN (
  SELECT COUNT(*) AS m
  FROM PRODUCTO p JOIN CATEGORIA c ON c.id_categoria = p.id_categoria
  WHERE c.nombre <> @CAT_SERVICIOS AND p.disponible = 1
) cnt
JOIN (
  SELECT p.id_producto, p.precio,
         ROW_NUMBER() OVER (ORDER BY p.id_producto) - 1 AS pos
  FROM PRODUCTO p JOIN CATEGORIA c ON c.id_categoria = p.id_categoria
  WHERE c.nombre <> @CAT_SERVICIOS AND p.disponible = 1
) prod ON prod.pos = MOD(ped.i * 5 + l.j * 3, cnt.m)
WHERE cnt.m > 0
  AND NOT EXISTS (SELECT 1 FROM DETALLE_PEDIDO d WHERE d.id_pedido = ped.id_pedido);

-- ---------------------------------------------------------------------
-- PEDIDO de suscripcion: uno por cada membresia de ejemplo, vendiendo
-- el producto de servicio (id_tipo_pedido = 'Suscripción Club Alan')
-- ---------------------------------------------------------------------
INSERT INTO PEDIDO (id_cliente, id_repartidor, fecha_hora, estado, modalidad, total,
                    direccion_entrega, observaciones, id_tipo_pedido)
SELECT c.id_cliente, NULL, TIMESTAMP(m.fecha_inicio, '12:00:00'), @EST_ENTREGADO, @MOD_LLEVAR, 0,
       NULL, CONCAT('seed-sub:', c.id_cliente),
       (SELECT t.id_tipo_pedido FROM TIPO_PEDIDO t WHERE t.descripcion = @TIPO_SUSCRIP LIMIT 1)
FROM MEMBRESIA m
JOIN CLIENTE c ON c.id_cliente = m.id_cliente
JOIN USUARIO u ON u.id_usuario = c.id_usuario
WHERE u.email LIKE '%@seed.local'
  AND NOT EXISTS (SELECT 1 FROM PEDIDO p WHERE p.observaciones = CONCAT('seed-sub:', c.id_cliente));

INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, cantidad, precio_unitario, observaciones)
SELECT p.id_pedido, svc.id_producto, 1, svc.precio, NULL
FROM PEDIDO p
JOIN (
  SELECT pr.id_producto, pr.precio
  FROM PRODUCTO pr JOIN CATEGORIA c ON c.id_categoria = pr.id_categoria
  WHERE c.nombre = @CAT_SERVICIOS AND pr.nombre = @PRODUCTO_CLUB
  LIMIT 1
) svc
WHERE p.observaciones LIKE 'seed-sub:%'
  AND NOT EXISTS (SELECT 1 FROM DETALLE_PEDIDO d WHERE d.id_pedido = p.id_pedido);

-- Total de cada pedido de ejemplo = suma de su detalle
UPDATE PEDIDO p
JOIN (
  SELECT id_pedido, SUM(cantidad * precio_unitario) AS total
  FROM DETALLE_PEDIDO
  GROUP BY id_pedido
) s ON s.id_pedido = p.id_pedido
SET p.total = s.total
WHERE p.observaciones LIKE 'seed%' AND p.total = 0;

-- ---------------------------------------------------------------------
-- PAGO: los pedidos entregados quedan pagados (mitad efectivo, mitad tarjeta)
-- ---------------------------------------------------------------------
INSERT INTO PAGO (id_pedido, fecha_pago, monto, metodo_pago, estado_pago, referencia)
SELECT p.id_pedido, p.fecha_hora, p.total,
       IF(MOD(p.id_pedido, 2) = 0, @PAGO_EFECTIVO, @PAGO_TARJETA),
       @PAGO_PAGADO,
       IF(MOD(p.id_pedido, 2) = 0, NULL, CONCAT('SEED-', p.id_pedido))
FROM PEDIDO p
WHERE p.observaciones LIKE 'seed%'
  AND p.estado = @EST_ENTREGADO
  AND p.total > 0
  AND NOT EXISTS (SELECT 1 FROM PAGO g WHERE g.id_pedido = p.id_pedido);

-- ---------------------------------------------------------------------
-- MOVIMIENTO_PUNTOS: los miembros acumulan 1 punto por cada Q10 de sus
-- pedidos entregados (fn_CalcularPuntos). El trigger
-- trg_ActualizarPuntosCliente suma esos puntos a CLIENTE.puntos_club_alan.
-- Estas sentencias no leen CLIENTE porque el trigger la actualiza (error 1442):
-- ser miembro se toma de MEMBRESIA (fecha_fin NULL).
-- ---------------------------------------------------------------------
INSERT INTO MOVIMIENTO_PUNTOS (id_cliente, id_pedido, tipo, puntos, fecha, descripcion)
SELECT p.id_cliente, p.id_pedido, 'ACUMULACION', fn_CalcularPuntos(p.total), p.fecha_hora,
       CONCAT('Acumulación por pedido #', p.id_pedido)
FROM PEDIDO p
JOIN MEMBRESIA ms ON ms.id_cliente = p.id_cliente AND ms.fecha_fin IS NULL
WHERE p.observaciones REGEXP '^seed:[0-9]+$'
  AND p.estado = @EST_ENTREGADO
  AND fn_CalcularPuntos(p.total) > 0
  AND NOT EXISTS (SELECT 1 FROM MOVIMIENTO_PUNTOS m WHERE m.id_pedido = p.id_pedido AND m.tipo = 'ACUMULACION');

-- Un canje de 20 puntos para quien ya acumulo al menos 40 con los pedidos de ejemplo
INSERT INTO MOVIMIENTO_PUNTOS (id_cliente, id_pedido, tipo, puntos, fecha, descripcion)
SELECT acc.id_cliente, NULL, 'CANJE', -20, NOW(), 'Canje de puntos (ejemplo)'
FROM (
  SELECT m.id_cliente, SUM(m.puntos) AS saldo
  FROM MOVIMIENTO_PUNTOS m
  JOIN PEDIDO p ON p.id_pedido = m.id_pedido AND p.observaciones REGEXP '^seed:[0-9]+$'
  GROUP BY m.id_cliente
) acc
WHERE acc.saldo >= 40
  AND NOT EXISTS (SELECT 1 FROM MOVIMIENTO_PUNTOS x
                  WHERE x.id_cliente = acc.id_cliente AND x.descripcion = 'Canje de puntos (ejemplo)');

-- ---------------------------------------------------------------------
-- Resumen de lo que quedo en la base
-- ---------------------------------------------------------------------
SELECT 'CATEGORIA' AS tabla, COUNT(*) AS filas FROM CATEGORIA
UNION ALL SELECT 'PRODUCTO',         COUNT(*) FROM PRODUCTO
UNION ALL SELECT 'USUARIO',          COUNT(*) FROM USUARIO
UNION ALL SELECT 'CLIENTE',          COUNT(*) FROM CLIENTE
UNION ALL SELECT 'REPARTIDOR',       COUNT(*) FROM REPARTIDOR
UNION ALL SELECT 'MEMBRESIA',        COUNT(*) FROM MEMBRESIA
UNION ALL SELECT 'PEDIDO',           COUNT(*) FROM PEDIDO
UNION ALL SELECT 'DETALLE_PEDIDO',   COUNT(*) FROM DETALLE_PEDIDO
UNION ALL SELECT 'PAGO',             COUNT(*) FROM PAGO
UNION ALL SELECT 'MOVIMIENTO_PUNTOS', COUNT(*) FROM MOVIMIENTO_PUNTOS;
