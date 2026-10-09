package com.taqueriaalan.auth.repository;

import com.taqueriaalan.auth.model.Cliente;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByIdUsuario(Long idUsuario);
}
