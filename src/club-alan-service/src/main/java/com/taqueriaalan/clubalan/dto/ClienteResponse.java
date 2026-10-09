package com.taqueriaalan.clubalan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteResponse {

    private Long idCliente;
    private String nombre;
    private String telefono;
    private String email;
    private Integer puntosClubAlan;
    private Boolean miembroClub;
}
