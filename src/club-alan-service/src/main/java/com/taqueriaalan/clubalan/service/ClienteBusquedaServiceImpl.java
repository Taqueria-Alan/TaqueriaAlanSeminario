package com.taqueriaalan.clubalan.service;

import com.taqueriaalan.clubalan.dto.ClienteBusquedaResponse;
import com.taqueriaalan.clubalan.model.ClienteBusquedaProjection;
import com.taqueriaalan.clubalan.repository.ClienteRepository;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClienteBusquedaServiceImpl implements ClienteBusquedaService {

    private static final int LONGITUD_MINIMA = 2;

    private final ClienteRepository clienteRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ClienteBusquedaResponse> buscar(String query) {
        String normalizada = query == null ? "" : query.trim();
        if (normalizada.length() < LONGITUD_MINIMA) {
            return Collections.emptyList();
        }

        return clienteRepository.buscarPorNombreOTelefono(normalizada).stream()
                .map(this::toResponse)
                .toList();
    }

    private ClienteBusquedaResponse toResponse(ClienteBusquedaProjection projection) {
        return ClienteBusquedaResponse.builder()
                .idCliente(projection.getIdCliente())
                .nombre(projection.getNombre())
                .telefono(projection.getTelefono())
                .puntos(projection.getPuntos())
                .miembroClub(projection.getMiembroClub())
                .build();
    }
}
