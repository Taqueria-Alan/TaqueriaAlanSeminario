package com.taqueriaalan.clubalan.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.taqueriaalan.clubalan.dto.ClienteBusquedaResponse;
import com.taqueriaalan.clubalan.model.ClienteBusquedaProjection;
import com.taqueriaalan.clubalan.repository.ClienteRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ClienteBusquedaServiceImplTest {

    @Mock
    private ClienteRepository clienteRepository;

    private ClienteBusquedaServiceImpl clienteBusquedaService;

    @BeforeEach
    void setUp() {
        clienteBusquedaService = new ClienteBusquedaServiceImpl(clienteRepository);
    }

    @Test
    void buscar_devuelveVacio_cuandoQueryEsMuyCorta() {
        List<ClienteBusquedaResponse> resultado = clienteBusquedaService.buscar("a");

        assertThat(resultado).isEmpty();
        verify(clienteRepository, never()).buscarPorNombreOTelefono(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void buscar_mapeaProyeccion_cuandoQueryEsValida() {
        ClienteBusquedaProjection projection = new ClienteBusquedaProjection() {
            @Override
            public Long getIdCliente() {
                return 1L;
            }

            @Override
            public String getNombre() {
                return "Juan Perez";
            }

            @Override
            public String getTelefono() {
                return "50212345678";
            }

            @Override
            public Integer getPuntos() {
                return 120;
            }

            @Override
            public Boolean getMiembroClub() {
                return true;
            }
        };

        when(clienteRepository.buscarPorNombreOTelefono("Juan")).thenReturn(List.of(projection));

        List<ClienteBusquedaResponse> resultado = clienteBusquedaService.buscar("Juan");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getIdCliente()).isEqualTo(1L);
        assertThat(resultado.get(0).getNombre()).isEqualTo("Juan Perez");
        assertThat(resultado.get(0).getMiembroClub()).isTrue();
    }
}
