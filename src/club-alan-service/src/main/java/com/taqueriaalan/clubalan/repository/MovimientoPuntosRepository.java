package com.taqueriaalan.clubalan.repository;

import com.taqueriaalan.clubalan.model.MovimientoPuntos;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MovimientoPuntosRepository extends JpaRepository<MovimientoPuntos, Long> {

    Page<MovimientoPuntos> findByIdClienteOrderByFechaDesc(Long idCliente, Pageable pageable);
}
