package com.taqueriaalan.pedidos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LineaPedidoRequest(
        @NotNull @JsonAlias("productoId") Long idProducto,
        @NotNull @Positive Integer cantidad,
        @Size(max = 255) String observaciones) {
}
