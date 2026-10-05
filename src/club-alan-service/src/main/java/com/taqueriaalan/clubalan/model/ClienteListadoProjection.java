package com.taqueriaalan.clubalan.model;

public interface ClienteListadoProjection {

    Long getIdCliente();

    String getNombre();

    String getTelefono();

    String getEmail();

    Integer getPuntosClubAlan();

    Boolean getMiembroClub();
}
