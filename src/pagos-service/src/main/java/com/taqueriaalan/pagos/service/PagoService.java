package com.taqueriaalan.pagos.service;

import com.taqueriaalan.pagos.dto.PagoRequest;
import com.taqueriaalan.pagos.dto.PagoResponse;

public interface PagoService {
    PagoResponse procesar(PagoRequest request, String idempotencyKey, String correlationId);

    PagoResponse obtenerPorPedido(Long idPedido);
}
