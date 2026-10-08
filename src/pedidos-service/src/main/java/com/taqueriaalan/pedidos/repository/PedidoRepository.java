package com.taqueriaalan.pedidos.repository;

import com.taqueriaalan.pedidos.model.Pedido;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByIdClienteOrderByFechaHoraDesc(Long idCliente);

    List<Pedido> findAllByOrderByFechaHoraDesc();

    @Query(value = "SELECT estado_pago FROM PAGO WHERE id_pedido = :idPedido ORDER BY id_pago DESC LIMIT 1", nativeQuery = true)
    String findUltimoEstadoPago(@Param("idPedido") Long idPedido);

    @Query(value = "SELECT COUNT(*) > 0 FROM PAGO WHERE id_pedido = :idPedido "
            + "AND estado_pago IN ('APROBADO', 'PAGADO')", nativeQuery = true)
    boolean existePagoAprobado(@Param("idPedido") Long idPedido);
}
