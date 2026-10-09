package com.taqueriaalan.pedidos.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Lectura del catálogo oficial. El precio de aquí, nunca del navegador, se usa para el total. */
@Entity
@Table(name = "PRODUCTO")
@Getter
@Setter
@NoArgsConstructor
public class Producto {

    @Id
    @Column(name = "id_producto")
    private Long idProducto;

    @Column(name = "nombre")
    private String nombre;

    @Column(name = "descripcion")
    private String descripcion;

    @Column(name = "precio")
    private BigDecimal precio;

    @Column(name = "disponible")
    private Boolean disponible;
}
