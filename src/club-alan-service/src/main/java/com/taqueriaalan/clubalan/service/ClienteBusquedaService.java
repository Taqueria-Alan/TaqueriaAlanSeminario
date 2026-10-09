package com.taqueriaalan.clubalan.service;

import com.taqueriaalan.clubalan.dto.ClienteBusquedaResponse;
import com.taqueriaalan.clubalan.dto.ClienteResponse;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ClienteBusquedaService {

    List<ClienteBusquedaResponse> buscar(String query);

    Page<ClienteResponse> listar(String query, Pageable pageable);
}
