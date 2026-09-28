package com.taqueriaalan.clubalan.repository;

import com.taqueriaalan.clubalan.model.Membresia;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MembresiaRepository extends JpaRepository<Membresia, Long> {

    Optional<Membresia> findByIdClienteAndFechaFinIsNull(Long idCliente);

    Optional<Membresia> findFirstByIdClienteOrderByFechaInicioDesc(Long idCliente);
}
