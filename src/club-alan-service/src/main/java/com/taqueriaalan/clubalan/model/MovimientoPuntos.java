package com.taqueriaalan.clubalan.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "MOVIMIENTO_PUNTOS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovimientoPuntos {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_movimiento")
    private Long idMovimiento;

    @Column(name = "id_cliente", nullable = false)
    private Long idCliente;

    @Column(name = "id_pedido")
    private Long idPedido;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoMovimiento tipo;

    @Column(name = "puntos", nullable = false)
    private Integer puntos;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    @Column(name = "descripcion")
    private String descripcion;
}
