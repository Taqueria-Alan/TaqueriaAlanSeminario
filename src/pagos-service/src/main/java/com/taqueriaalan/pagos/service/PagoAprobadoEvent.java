package com.taqueriaalan.pagos.service;

import java.math.BigDecimal;

/**
 * Evento interno publicado dentro de la transacción de pago. Club Alan lo
 * consume después del commit para no retener el bloqueo de PEDIDO mientras
 * inserta un movimiento que posee una llave foránea hacia esa misma orden.
 */
public record PagoAprobadoEvent(
        Long idPedido,
        Long idCliente,
        BigDecimal monto,
        boolean suscripcion,
        String correlationId) {
}
