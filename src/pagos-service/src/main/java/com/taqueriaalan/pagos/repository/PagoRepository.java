package com.taqueriaalan.pagos.repository;

import com.taqueriaalan.pagos.model.EstadoPago;
import com.taqueriaalan.pagos.model.Pago;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PagoRepository extends JpaRepository<Pago, Long> {

    Optional<Pago> findFirstByIdPedidoAndEstadoPagoOrderByIdPagoDesc(Long idPedido, EstadoPago estadoPago);

    Optional<Pago> findFirstByIdPedidoOrderByIdPagoDesc(Long idPedido);

    Optional<Pago> findByIdPedidoAndIdempotencyKey(Long idPedido, String idempotencyKey);
}
