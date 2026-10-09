package com.taqueriaalan.auth.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "CLIENTE")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cliente")
    private Long idCliente;

    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name = "puntos_club_alan")
    private Integer puntosClubAlan = 0;

    @Column(name = "miembro_club")
    private Boolean miembroClub = false;

    public Cliente() {
    }

    public Cliente(Long idUsuario) {
        this.idUsuario = idUsuario;
    }

    public Long getIdCliente() {
        return idCliente;
    }

    public Long getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Long idUsuario) {
        this.idUsuario = idUsuario;
    }

    public Integer getPuntosClubAlan() {
        return puntosClubAlan;
    }

    public Boolean getMiembroClub() {
        return miembroClub;
    }
}
