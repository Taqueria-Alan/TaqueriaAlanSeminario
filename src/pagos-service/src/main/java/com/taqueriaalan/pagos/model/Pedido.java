package com.taqueriaalan.pagos.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Proyección de escritura compartida para coordinar el mock de pago local. */
@Entity
@Table(name = "PEDIDO")
@Getter
@Setter
@NoArgsConstructor
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pedido")
    private Long idPedido;

    @Column(name = "id_cliente")
    private Long idCliente;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado")
    private EstadoPedido estado;

    @Column(name = "id_tipo_pedido")
    private Long idTipoPedido;

    @Column(name = "total")
    private BigDecimal total;

    /** Comparte el bloqueo optimista con pedidos-service al actualizar estado. */
    @Version
    @Column(name = "version")
    private Long version;
}
