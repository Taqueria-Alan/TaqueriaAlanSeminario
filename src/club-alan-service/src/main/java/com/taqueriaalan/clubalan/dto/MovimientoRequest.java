package com.taqueriaalan.clubalan.dto;

import com.taqueriaalan.clubalan.model.TipoMovimiento;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MovimientoRequest {

    @NotNull(message = "El tipo de movimiento es obligatorio")
    private TipoMovimiento tipo;

    @NotNull(message = "Los puntos son obligatorios")
    @Positive(message = "Los puntos deben ser un valor positivo")
    private Integer puntos;

    private Long idPedido;

    private String descripcion;
}
