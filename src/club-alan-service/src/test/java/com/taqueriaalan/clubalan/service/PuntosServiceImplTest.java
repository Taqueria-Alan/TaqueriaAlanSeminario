package com.taqueriaalan.clubalan.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.taqueriaalan.clubalan.dto.MovimientoRequest;
import com.taqueriaalan.clubalan.dto.MovimientoResponse;
import com.taqueriaalan.clubalan.exception.ConflictException;
import com.taqueriaalan.clubalan.exception.ResourceNotFoundException;
import com.taqueriaalan.clubalan.model.Cliente;
import com.taqueriaalan.clubalan.model.MovimientoPuntos;
import com.taqueriaalan.clubalan.model.TipoMovimiento;
import com.taqueriaalan.clubalan.repository.ClienteRepository;
import com.taqueriaalan.clubalan.repository.MovimientoPuntosRepository;
import jakarta.persistence.EntityManager;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PuntosServiceImplTest {

    @Mock
    private ClienteRepository clienteRepository;

    @Mock
    private MovimientoPuntosRepository movimientoPuntosRepository;

    @Mock
    private EntityManager entityManager;

    private PuntosServiceImpl puntosService;

    @BeforeEach
    void setUp() {
        puntosService = new PuntosServiceImpl(clienteRepository, movimientoPuntosRepository, entityManager);
    }

    @Test
    void registrarMovimiento_lanzaConflictException_cuandoCanjeSinSaldoSuficiente() {
        Cliente cliente = new Cliente();
        cliente.setIdCliente(1L);
        cliente.setPuntosClubAlan(50);
        cliente.setMiembroClub(true);

        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));

        MovimientoRequest request = new MovimientoRequest();
        request.setTipo(TipoMovimiento.CANJE);
        request.setPuntos(100);

        assertThatThrownBy(() -> puntosService.registrarMovimiento(1L, request))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void registrarMovimiento_lanzaResourceNotFound_cuandoClienteNoExiste() {
        when(clienteRepository.findById(99L)).thenReturn(Optional.empty());

        MovimientoRequest request = new MovimientoRequest();
        request.setTipo(TipoMovimiento.ACUMULACION);
        request.setPuntos(10);

        assertThatThrownBy(() -> puntosService.registrarMovimiento(99L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void registrarMovimiento_guardaPuntosNegativos_cuandoCanjeConSaldoSuficiente() {
        Cliente cliente = new Cliente();
        cliente.setIdCliente(1L);
        cliente.setPuntosClubAlan(100);
        cliente.setMiembroClub(true);

        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));

        MovimientoRequest request = new MovimientoRequest();
        request.setTipo(TipoMovimiento.CANJE);
        request.setPuntos(30);

        puntosService.registrarMovimiento(1L, request);

        ArgumentCaptor<MovimientoPuntos> captor = ArgumentCaptor.forClass(MovimientoPuntos.class);
        verify(movimientoPuntosRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getPuntos()).isEqualTo(-30);
        verify(entityManager).refresh(cliente);
    }

    @Test
    void registrarMovimiento_guardaPuntosPositivos_cuandoAcumulacion() {
        Cliente cliente = new Cliente();
        cliente.setIdCliente(1L);
        cliente.setPuntosClubAlan(10);
        cliente.setMiembroClub(false);

        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));

        MovimientoRequest request = new MovimientoRequest();
        request.setTipo(TipoMovimiento.ACUMULACION);
        request.setPuntos(25);

        MovimientoResponse response = puntosService.registrarMovimiento(1L, request);

        ArgumentCaptor<MovimientoPuntos> captor = ArgumentCaptor.forClass(MovimientoPuntos.class);
        verify(movimientoPuntosRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getPuntos()).isEqualTo(25);
        assertThat(response.getTipo()).isEqualTo(TipoMovimiento.ACUMULACION);
    }
}
