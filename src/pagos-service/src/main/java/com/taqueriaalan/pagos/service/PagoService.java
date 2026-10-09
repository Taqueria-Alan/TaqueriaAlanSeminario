package com.taqueriaalan.pagos.service;

import com.taqueriaalan.pagos.dto.PagoRequest;
import com.taqueriaalan.pagos.dto.PagoResponse;

public interface PagoService {
    PagoResponse procesar(PagoRequest request, String idempotencyKey, String correlationId, Long idClienteAutenticado,
            String rol);

    PagoResponse obtenerPorPedido(Long idPedido, Long idClienteAutenticado, String rol);
}
