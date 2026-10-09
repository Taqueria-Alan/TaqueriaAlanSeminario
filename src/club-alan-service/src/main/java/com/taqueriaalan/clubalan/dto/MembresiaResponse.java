package com.taqueriaalan.clubalan.dto;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembresiaResponse {

    private Long idMembresia;
    private Long idCliente;
    private Boolean envioGratis;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Boolean activa;
}
