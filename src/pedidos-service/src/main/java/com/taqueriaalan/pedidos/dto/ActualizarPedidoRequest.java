package com.taqueriaalan.pedidos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.taqueriaalan.pedidos.model.ModalidadPedido;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ActualizarPedidoRequest(
        @NotNull @JsonAlias("modalidad") ModalidadPedido tipo,
        @JsonAlias("direccionEntrega") @Size(max = 255) String direccion,
        @Size(max = 255) String observaciones,
        @NotEmpty @Valid @JsonAlias("items") List<LineaPedidoRequest> lineas) {
}
