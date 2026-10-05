package com.taqueriaalan.clubalan.model;

import java.time.LocalDate;

public interface MembresiaListadoProjection {

    Long getIdCliente();

    String getNombre();

    String getTelefono();

    LocalDate getFechaInicio();

    LocalDate getFechaFin();

    Boolean getEnvioGratis();
}
