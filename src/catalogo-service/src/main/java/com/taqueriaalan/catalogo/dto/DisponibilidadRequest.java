package com.taqueriaalan.catalogo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DisponibilidadRequest {

    @NotNull(message = "El campo disponible es obligatorio")
    private Boolean disponible;
}
