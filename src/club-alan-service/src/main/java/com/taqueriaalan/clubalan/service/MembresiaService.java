package com.taqueriaalan.clubalan.service;

import com.taqueriaalan.clubalan.dto.MembresiaResponse;

public interface MembresiaService {

    MembresiaResponse activar(Long idCliente);

    MembresiaResponse obtenerEstado(Long idCliente);

    void cancelar(Long idCliente);
}
