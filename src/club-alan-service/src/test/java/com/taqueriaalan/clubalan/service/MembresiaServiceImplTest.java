package com.taqueriaalan.clubalan.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.taqueriaalan.clubalan.dto.MembresiaResponse;
import com.taqueriaalan.clubalan.exception.ConflictException;
import com.taqueriaalan.clubalan.exception.ResourceNotFoundException;
import com.taqueriaalan.clubalan.model.Cliente;
import com.taqueriaalan.clubalan.model.Membresia;
import com.taqueriaalan.clubalan.repository.ClienteRepository;
import com.taqueriaalan.clubalan.repository.MembresiaRepository;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MembresiaServiceImplTest {

    @Mock
    private ClienteRepository clienteRepository;

    @Mock
    private MembresiaRepository membresiaRepository;

    private MembresiaServiceImpl membresiaService;

    @BeforeEach
    void setUp() {
        membresiaService = new MembresiaServiceImpl(clienteRepository, membresiaRepository);
    }

    @Test
    void activar_creaMembresiaYMarcaCliente_cuandoNoTieneMembresiaActiva() {
        Cliente cliente = new Cliente();
        cliente.setIdCliente(1L);
        cliente.setMiembroClub(false);

        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(membresiaRepository.findByIdClienteAndFechaFinIsNull(1L)).thenReturn(Optional.empty());

        MembresiaResponse response = membresiaService.activar(1L);

        assertThat(response.getActiva()).isTrue();
        assertThat(response.getEnvioGratis()).isTrue();
        assertThat(cliente.getMiembroClub()).isTrue();
        verify(clienteRepository).save(cliente);
    }

    @Test
    void activar_lanzaConflictException_cuandoYaTieneMembresiaActiva() {
        Cliente cliente = new Cliente();
        cliente.setIdCliente(1L);

        Membresia existente = Membresia.builder()
                .idMembresia(5L)
                .idCliente(1L)
                .envioGratis(true)
                .fechaInicio(LocalDate.now().minusDays(10))
                .build();

        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(membresiaRepository.findByIdClienteAndFechaFinIsNull(1L)).thenReturn(Optional.of(existente));

        assertThatThrownBy(() -> membresiaService.activar(1L)).isInstanceOf(ConflictException.class);
    }

    @Test
    void cancelar_lanzaResourceNotFound_cuandoNoHayMembresiaActiva() {
        Cliente cliente = new Cliente();
        cliente.setIdCliente(1L);

        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(membresiaRepository.findByIdClienteAndFechaFinIsNull(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> membresiaService.cancelar(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void cancelar_marcaFechaFinYActualizaCliente_cuandoTieneMembresiaActiva() {
        Cliente cliente = new Cliente();
        cliente.setIdCliente(1L);
        cliente.setMiembroClub(true);

        Membresia membresia = Membresia.builder()
                .idMembresia(5L)
                .idCliente(1L)
                .envioGratis(true)
                .fechaInicio(LocalDate.now().minusDays(10))
                .build();

        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(membresiaRepository.findByIdClienteAndFechaFinIsNull(1L)).thenReturn(Optional.of(membresia));

        membresiaService.cancelar(1L);

        assertThat(membresia.getFechaFin()).isEqualTo(LocalDate.now());
        assertThat(cliente.getMiembroClub()).isFalse();
        verify(membresiaRepository).save(membresia);
        verify(clienteRepository).save(cliente);
    }
}
