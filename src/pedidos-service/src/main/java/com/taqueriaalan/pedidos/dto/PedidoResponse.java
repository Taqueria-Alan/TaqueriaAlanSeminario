package com.taqueriaalan.pedidos.dto;

import com.taqueriaalan.pedidos.model.ClasePedido;
import com.taqueriaalan.pedidos.model.EstadoPedido;
import com.taqueriaalan.pedidos.model.ModalidadPedido;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoResponse(
        Long id,
        String codigoPedido,
        Long idCliente,
        String cliente,
        ModalidadPedido tipo,
        ClasePedido clase,
        String direccion,
        EstadoPedido estado,
        List<LineaPedidoResponse> lineas,
        BigDecimal total,
        String observaciones,
        LocalDateTime creadoEn,
        LocalDateTime actualizadoEn,
        String pagoEstado) {
}
