package com.taqueriaalan.clubalan.service;

import com.taqueriaalan.clubalan.dto.MembresiaResponse;
import com.taqueriaalan.clubalan.exception.ConflictException;
import com.taqueriaalan.clubalan.exception.ResourceNotFoundException;
import com.taqueriaalan.clubalan.model.Cliente;
import com.taqueriaalan.clubalan.model.Membresia;
import com.taqueriaalan.clubalan.repository.ClienteRepository;
import com.taqueriaalan.clubalan.repository.MembresiaRepository;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MembresiaServiceImpl implements MembresiaService {

    private final ClienteRepository clienteRepository;
    private final MembresiaRepository membresiaRepository;

    @Override
    @Transactional
    public MembresiaResponse activar(Long idCliente) {
        Cliente cliente = obtenerClienteOrThrow(idCliente);

        if (membresiaRepository.findByIdClienteAndFechaFinIsNull(idCliente).isPresent()) {
            throw new ConflictException("El cliente ya tiene una membresia activa");
        }

        Membresia membresia = Membresia.builder()
                .idCliente(idCliente)
                .envioGratis(true)
                .fechaInicio(LocalDate.now())
                .fechaFin(null)
                .build();
        membresiaRepository.save(membresia);

        cliente.setMiembroClub(true);
        clienteRepository.save(cliente);

        return toResponse(membresia);
    }

    @Override
    @Transactional(readOnly = true)
    public MembresiaResponse obtenerEstado(Long idCliente) {
        obtenerClienteOrThrow(idCliente);
        Membresia membresia = membresiaRepository.findFirstByIdClienteOrderByFechaInicioDesc(idCliente)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "El cliente no tiene una membresia registrada"));
        return toResponse(membresia);
    }

    @Override
    @Transactional
    public void cancelar(Long idCliente) {
        Cliente cliente = obtenerClienteOrThrow(idCliente);
        Membresia membresia = membresiaRepository.findByIdClienteAndFechaFinIsNull(idCliente)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "El cliente no tiene una membresia activa"));

        membresia.setFechaFin(LocalDate.now());
        membresiaRepository.save(membresia);

        cliente.setMiembroClub(false);
        clienteRepository.save(cliente);
    }

    private Cliente obtenerClienteOrThrow(Long idCliente) {
        return clienteRepository.findById(idCliente)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontro el cliente con id " + idCliente));
    }

    private MembresiaResponse toResponse(Membresia membresia) {
        return MembresiaResponse.builder()
                .idMembresia(membresia.getIdMembresia())
                .idCliente(membresia.getIdCliente())
                .envioGratis(membresia.getEnvioGratis())
                .fechaInicio(membresia.getFechaInicio())
                .fechaFin(membresia.getFechaFin())
                .activa(membresia.getFechaFin() == null)
                .build();
    }
}
