package com.taqueriaalan.pagos.repository;

import com.taqueriaalan.pagos.model.Pedido;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select pedido from Pedido pedido where pedido.idPedido = :idPedido")
    Optional<Pedido> findByIdForUpdate(@Param("idPedido") Long idPedido);
}
