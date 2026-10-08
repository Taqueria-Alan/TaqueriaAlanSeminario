package com.taqueriaalan.pedidos.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @Column(name = "id_cliente", nullable = false)
    private Long idCliente;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoPedido estado;

    @Enumerated(EnumType.STRING)
    @Column(name = "modalidad", nullable = false)
    private ModalidadPedido modalidad;

    @Column(name = "total", nullable = false)
    private BigDecimal total;

    @Column(name = "direccion_entrega")
    private String direccionEntrega;

    @Column(name = "observaciones")
    private String observaciones;

    @Column(name = "id_tipo_pedido")
    private Long idTipoPedido;

    @Column(name = "actualizado_en")
    private LocalDateTime actualizadoEn;

    @Column(name = "cancelado_en")
    private LocalDateTime canceladoEn;

    @Column(name = "motivo_cancelacion")
    private String motivoCancelacion;

    @Version
    @Column(name = "version")
    private Long version;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DetallePedido> detalles = new ArrayList<>();

    public void reemplazarDetalles(List<DetallePedido> nuevosDetalles) {
        detalles.clear();
        nuevosDetalles.forEach(this::agregarDetalle);
    }

    public void agregarDetalle(DetallePedido detalle) {
        detalle.setPedido(this);
        detalles.add(detalle);
    }
}
