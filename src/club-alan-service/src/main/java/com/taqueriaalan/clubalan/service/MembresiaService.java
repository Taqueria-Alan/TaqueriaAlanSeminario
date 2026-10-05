package com.taqueriaalan.clubalan.service;

import com.taqueriaalan.clubalan.dto.ClienteMembresiaResponse;
import com.taqueriaalan.clubalan.dto.MembresiaResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MembresiaService {

    MembresiaResponse activar(Long idCliente);

    MembresiaResponse obtenerEstado(Long idCliente);

    void cancelar(Long idCliente);

    Page<ClienteMembresiaResponse> listarMiembros(String estado, Pageable pageable);
}
