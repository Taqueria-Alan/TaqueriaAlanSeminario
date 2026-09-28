package com.taqueriaalan.clubalan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PuntosResponse {

    private Long idCliente;
    private Integer puntos;
    private Boolean miembroClub;
}
