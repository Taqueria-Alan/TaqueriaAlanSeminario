package com.taqueriaalan.pedidos.dto;

import java.math.BigDecimal;

public record LineaPedidoResponse(
        Long idProducto,
        String nombre,
        String detalle,
        BigDecimal precio,
        Integer cantidad,
        String observaciones) {
}
