-- =====================================================================
-- Migración idempotente: flujo funcional de Pedidos + Pagos.
--
-- Se ejecuta después de 01-schema.sql, 02-catalogos-base.sql y 03-datos-demo.sql.
-- No almacena PAN, CVV, token de tarjeta ni secretos; solo resultados de la
-- simulación de pago para conservar trazabilidad académica.
-- =====================================================================

USE taqueria_db;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_migrar_gestion_pedidos$$

CREATE PROCEDURE sp_migrar_gestion_pedidos()
BEGIN
  -- PEDIDO: auditoría de actualización/cancelación y bloqueo optimista.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'PEDIDO' AND column_name = 'actualizado_en'
  ) THEN
    ALTER TABLE PEDIDO ADD COLUMN actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'PEDIDO' AND column_name = 'cancelado_en'
  ) THEN
    ALTER TABLE PEDIDO ADD COLUMN cancelado_en DATETIME NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'PEDIDO' AND column_name = 'motivo_cancelacion'
  ) THEN
    ALTER TABLE PEDIDO ADD COLUMN motivo_cancelacion VARCHAR(255) NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'PEDIDO' AND column_name = 'version'
  ) THEN
    ALTER TABLE PEDIDO ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'PEDIDO' AND index_name = 'IDX_PEDIDO_CLIENTE_FECHA'
  ) THEN
    CREATE INDEX IDX_PEDIDO_CLIENTE_FECHA ON PEDIDO (id_cliente, fecha_hora);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'PEDIDO' AND index_name = 'IDX_PEDIDO_ESTADO'
  ) THEN
    CREATE INDEX IDX_PEDIDO_ESTADO ON PEDIDO (estado);
  END IF;

  -- DETALLE_PEDIDO: conserva el nombre y subtotal vistos por el cliente aun si el catálogo cambia.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'DETALLE_PEDIDO' AND column_name = 'nombre_producto'
  ) THEN
    ALTER TABLE DETALLE_PEDIDO ADD COLUMN nombre_producto VARCHAR(100) NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'DETALLE_PEDIDO' AND column_name = 'subtotal_linea'
  ) THEN
    ALTER TABLE DETALLE_PEDIDO ADD COLUMN subtotal_linea DECIMAL(10,2) NULL;
  END IF;

  UPDATE DETALLE_PEDIDO d
  JOIN PRODUCTO p ON p.id_producto = d.id_producto
  SET d.nombre_producto = COALESCE(d.nombre_producto, p.nombre),
      d.subtotal_linea = COALESCE(d.subtotal_linea, d.cantidad * d.precio_unitario);

  ALTER TABLE DETALLE_PEDIDO MODIFY COLUMN nombre_producto VARCHAR(100) NOT NULL;
  ALTER TABLE DETALLE_PEDIDO MODIFY COLUMN subtotal_linea DECIMAL(10,2) NOT NULL;

  -- PAGO: clave idempotente y detalle del resultado seguro de la simulación.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'PAGO' AND column_name = 'idempotency_key'
  ) THEN
    ALTER TABLE PAGO ADD COLUMN idempotency_key VARCHAR(64) NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'PAGO' AND column_name = 'codigo_resultado'
  ) THEN
    ALTER TABLE PAGO ADD COLUMN codigo_resultado VARCHAR(50) NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'PAGO' AND column_name = 'motivo_rechazo'
  ) THEN
    ALTER TABLE PAGO ADD COLUMN motivo_rechazo VARCHAR(255) NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'PAGO' AND column_name = 'actualizado_en'
  ) THEN
    ALTER TABLE PAGO ADD COLUMN actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP;
  END IF;

  -- Compatibilidad con las filas demo anteriores a esta migración.
  UPDATE PAGO
  SET estado_pago = 'APROBADO', codigo_resultado = COALESCE(codigo_resultado, 'APROBADO')
  WHERE estado_pago = 'PAGADO';

  -- La clave de idempotencia solo tiene significado dentro del pedido. Una
  -- misma clave enviada por error para otro pedido no puede reutilizar un pago
  -- ajeno. Se elimina la variante global si una ejecución anterior la creó.
  IF EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'PAGO' AND index_name = 'UQ_PAGO_IDEMPOTENCY'
  ) THEN
    ALTER TABLE PAGO DROP INDEX UQ_PAGO_IDEMPOTENCY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'PAGO' AND index_name = 'UQ_PAGO_PEDIDO_IDEMPOTENCY'
  ) THEN
    CREATE UNIQUE INDEX UQ_PAGO_PEDIDO_IDEMPOTENCY ON PAGO (id_pedido, idempotency_key);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'PAGO' AND index_name = 'IDX_PAGO_PEDIDO_ESTADO'
  ) THEN
    CREATE INDEX IDX_PAGO_PEDIDO_ESTADO ON PAGO (id_pedido, estado_pago);
  END IF;

  -- Evita volver a acreditar puntos en un reintento de un mismo pedido.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'MOVIMIENTO_PUNTOS' AND index_name = 'UQ_MOVIMIENTO_PEDIDO_TIPO'
  ) THEN
    CREATE UNIQUE INDEX UQ_MOVIMIENTO_PEDIDO_TIPO ON MOVIMIENTO_PUNTOS (id_pedido, tipo);
  END IF;
END$$

DELIMITER ;

CALL sp_migrar_gestion_pedidos();
DROP PROCEDURE sp_migrar_gestion_pedidos;
