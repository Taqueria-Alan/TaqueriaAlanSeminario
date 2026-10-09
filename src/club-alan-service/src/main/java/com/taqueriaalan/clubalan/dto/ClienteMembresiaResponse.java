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
public class ClienteMembresiaResponse {

    private Long idCliente;
    private String nombre;
    private String telefono;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Boolean envioGratis;
    private Boolean activa;
}
