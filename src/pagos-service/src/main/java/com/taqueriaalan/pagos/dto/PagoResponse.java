package com.taqueriaalan.pagos.dto;

import com.taqueriaalan.pagos.model.EstadoPago;
import com.taqueriaalan.pagos.model.EstadoPedido;
import com.taqueriaalan.pagos.model.MetodoPago;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PagoResponse(
        Long idPago,
        Long idPedido,
        BigDecimal monto,
        MetodoPago metodoPago,
        EstadoPago estadoPago,
        String codigoResultado,
        String referencia,
        EstadoPedido pedidoEstado,
        LocalDateTime fechaPago,
        boolean idempotente) {
}
