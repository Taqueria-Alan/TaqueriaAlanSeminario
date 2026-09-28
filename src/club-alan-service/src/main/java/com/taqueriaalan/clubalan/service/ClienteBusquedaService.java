package com.taqueriaalan.clubalan.service;

import com.taqueriaalan.clubalan.dto.ClienteBusquedaResponse;
import java.util.List;

public interface ClienteBusquedaService {

    List<ClienteBusquedaResponse> buscar(String query);
}
