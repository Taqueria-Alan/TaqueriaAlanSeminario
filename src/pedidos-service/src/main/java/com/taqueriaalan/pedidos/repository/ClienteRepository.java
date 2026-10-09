package com.taqueriaalan.pedidos.repository;

import com.taqueriaalan.pedidos.model.Cliente;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    @Query(value = "SELECT u.nombre FROM CLIENTE c JOIN USUARIO u ON u.id_usuario = c.id_usuario "
            + "WHERE c.id_cliente = :idCliente", nativeQuery = true)
    Optional<String> findNombreByIdCliente(@Param("idCliente") Long idCliente);
}
