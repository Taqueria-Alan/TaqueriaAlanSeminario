package com.taqueriaalan.clubalan.service;

import com.taqueriaalan.clubalan.dto.MovimientoRequest;
import com.taqueriaalan.clubalan.dto.MovimientoResponse;
import com.taqueriaalan.clubalan.dto.PuntosResponse;
import com.taqueriaalan.clubalan.exception.ConflictException;
import com.taqueriaalan.clubalan.exception.ResourceNotFoundException;
import com.taqueriaalan.clubalan.model.Cliente;
import com.taqueriaalan.clubalan.model.MovimientoPuntos;
import com.taqueriaalan.clubalan.model.TipoMovimiento;
import com.taqueriaalan.clubalan.repository.ClienteRepository;
import com.taqueriaalan.clubalan.repository.MovimientoPuntosRepository;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PuntosServiceImpl implements PuntosService {

    private final ClienteRepository clienteRepository;
    private final MovimientoPuntosRepository movimientoPuntosRepository;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public PuntosResponse obtenerSaldo(Long idCliente) {
        Cliente cliente = obtenerClienteOrThrow(idCliente);
        return toPuntosResponse(cliente);
    }

    @Override
    @Transactional
    public MovimientoResponse registrarMovimiento(Long idCliente, MovimientoRequest request) {
        Cliente cliente = obtenerClienteOrThrow(idCliente);

        int puntosMovimiento = request.getPuntos();
        if (request.getTipo() == TipoMovimiento.CANJE) {
            int saldoActual = cliente.getPuntosClubAlan() == null ? 0 : cliente.getPuntosClubAlan();
            if (saldoActual < puntosMovimiento) {
                throw new ConflictException(
                        "El cliente no tiene saldo suficiente de puntos para realizar el canje");
            }
            puntosMovimiento = -puntosMovimiento;
        }

        MovimientoPuntos movimiento = MovimientoPuntos.builder()
                .idCliente(idCliente)
                .idPedido(request.getIdPedido())
                .tipo(request.getTipo())
                .puntos(puntosMovimiento)
                .fecha(LocalDateTime.now())
                .descripcion(request.getDescripcion())
                .build();

        movimientoPuntosRepository.saveAndFlush(movimiento);
        entityManager.refresh(cliente);

        return MovimientoResponse.builder()
                .idMovimiento(movimiento.getIdMovimiento())
                .idCliente(movimiento.getIdCliente())
                .idPedido(movimiento.getIdPedido())
                .tipo(movimiento.getTipo())
                .puntos(movimiento.getPuntos())
                .fecha(movimiento.getFecha())
                .descripcion(movimiento.getDescripcion())
                .saldoActual(cliente.getPuntosClubAlan())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MovimientoResponse> listarMovimientos(Long idCliente, Pageable pageable) {
        obtenerClienteOrThrow(idCliente);
        return movimientoPuntosRepository.findByIdClienteOrderByFechaDesc(idCliente, pageable)
                .map(movimiento -> MovimientoResponse.builder()
                        .idMovimiento(movimiento.getIdMovimiento())
                        .idCliente(movimiento.getIdCliente())
                        .idPedido(movimiento.getIdPedido())
                        .tipo(movimiento.getTipo())
                        .puntos(movimiento.getPuntos())
                        .fecha(movimiento.getFecha())
                        .descripcion(movimiento.getDescripcion())
                        .build());
    }

    private Cliente obtenerClienteOrThrow(Long idCliente) {
        return clienteRepository.findById(idCliente)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontro el cliente con id " + idCliente));
    }

    private PuntosResponse toPuntosResponse(Cliente cliente) {
        return PuntosResponse.builder()
                .idCliente(cliente.getIdCliente())
                .puntos(cliente.getPuntosClubAlan())
                .miembroClub(cliente.getMiembroClub())
                .build();
    }
}
