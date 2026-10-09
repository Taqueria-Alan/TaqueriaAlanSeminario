package com.taqueriaalan.pagos.dto;

public record MovimientoRequest(String tipo, Integer puntos, Long idPedido, String descripcion) {
}
