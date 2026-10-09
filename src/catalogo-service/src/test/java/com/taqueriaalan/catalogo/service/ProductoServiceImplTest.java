package com.taqueriaalan.catalogo.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.taqueriaalan.catalogo.dto.DisponibilidadRequest;
import com.taqueriaalan.catalogo.dto.ProductoResponse;
import com.taqueriaalan.catalogo.exception.ResourceNotFoundException;
import com.taqueriaalan.catalogo.model.Producto;
import com.taqueriaalan.catalogo.repository.ProductoRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProductoServiceImplTest {

    @Mock
    private ProductoRepository productoRepository;

    private ProductoServiceImpl productoService;

    @BeforeEach
    void setUp() {
        productoService = new ProductoServiceImpl(productoRepository);
    }

    @Test
    void obtenerPorId_lanzaResourceNotFound_cuandoNoExiste() {
        when(productoRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productoService.obtenerPorId(1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void actualizarDisponibilidad_soloCambiaEseCampo() {
        Producto producto = Producto.builder()
                .idProducto(1L)
                .idCategoria(2L)
                .nombre("Taco al pastor")
                .precio(new BigDecimal("25.00"))
                .disponible(true)
                .build();

        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));
        when(productoRepository.save(any(Producto.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DisponibilidadRequest request = new DisponibilidadRequest();
        request.setDisponible(false);

        ProductoResponse response = productoService.actualizarDisponibilidad(1L, request);

        assertThat(response.getDisponible()).isFalse();
        assertThat(response.getNombre()).isEqualTo("Taco al pastor");
    }
}
