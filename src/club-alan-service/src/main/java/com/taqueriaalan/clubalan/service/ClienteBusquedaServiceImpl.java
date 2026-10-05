package com.taqueriaalan.clubalan.service;

import com.taqueriaalan.clubalan.dto.ClienteBusquedaResponse;
import com.taqueriaalan.clubalan.dto.ClienteResponse;
import com.taqueriaalan.clubalan.model.ClienteBusquedaProjection;
import com.taqueriaalan.clubalan.model.ClienteListadoProjection;
import com.taqueriaalan.clubalan.repository.ClienteRepository;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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

    @Override
    @Transactional(readOnly = true)
    public Page<ClienteResponse> listar(String query, Pageable pageable) {
        String normalizada = StringUtils.hasText(query) ? query.trim() : null;
        return clienteRepository.listar(normalizada, pageable).map(this::toResponse);
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

    private ClienteResponse toResponse(ClienteListadoProjection projection) {
        return ClienteResponse.builder()
                .idCliente(projection.getIdCliente())
                .nombre(projection.getNombre())
                .telefono(projection.getTelefono())
                .email(projection.getEmail())
                .puntosClubAlan(projection.getPuntosClubAlan())
                .miembroClub(projection.getMiembroClub())
                .build();
    }
}
