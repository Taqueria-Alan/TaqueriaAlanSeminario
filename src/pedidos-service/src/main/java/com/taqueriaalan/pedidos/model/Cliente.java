package com.taqueriaalan.pedidos.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "CLIENTE")
@Getter
@Setter
@NoArgsConstructor
public class Cliente {

    @Id
    @Column(name = "id_cliente")
    private Long idCliente;

    @Column(name = "id_usuario")
    private Long idUsuario;
}
