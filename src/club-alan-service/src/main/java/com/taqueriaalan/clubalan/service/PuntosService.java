package com.taqueriaalan.clubalan.service;

import com.taqueriaalan.clubalan.dto.MovimientoRequest;
import com.taqueriaalan.clubalan.dto.MovimientoResponse;
import com.taqueriaalan.clubalan.dto.PuntosResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PuntosService {

    PuntosResponse obtenerSaldo(Long idCliente);

    MovimientoResponse registrarMovimiento(Long idCliente, MovimientoRequest request);

    Page<MovimientoResponse> listarMovimientos(Long idCliente, Pageable pageable);
}
