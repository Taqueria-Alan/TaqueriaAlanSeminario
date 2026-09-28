package com.taqueriaalan.catalogo.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.taqueriaalan.catalogo.dto.CategoriaRequest;
import com.taqueriaalan.catalogo.dto.CategoriaResponse;
import com.taqueriaalan.catalogo.exception.ResourceNotFoundException;
import com.taqueriaalan.catalogo.model.Categoria;
import com.taqueriaalan.catalogo.repository.CategoriaRepository;
import com.taqueriaalan.catalogo.repository.ProductoRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CategoriaServiceImplTest {

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private ProductoRepository productoRepository;

    private CategoriaServiceImpl categoriaService;

    @BeforeEach
    void setUp() {
        categoriaService = new CategoriaServiceImpl(categoriaRepository, productoRepository);
    }

    @Test
    void obtenerPorId_lanzaResourceNotFound_cuandoNoExiste() {
        when(categoriaRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoriaService.obtenerPorId(1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void crear_activaPorDefecto_cuandoNoSeEspecifica() {
        CategoriaRequest request = new CategoriaRequest();
        request.setNombre("Bebidas");

        when(categoriaRepository.save(org.mockito.ArgumentMatchers.any(Categoria.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CategoriaResponse response = categoriaService.crear(request);

        assertThat(response.getActiva()).isTrue();
    }

    @Test
    void eliminar_hazDeleteFisico_cuandoNoTieneProductosAsociados() {
        Categoria categoria = Categoria.builder().idCategoria(1L).nombre("Postres").activa(true).build();
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(productoRepository.existsByIdCategoria(1L)).thenReturn(false);

        categoriaService.eliminar(1L);

        verify(categoriaRepository).delete(categoria);
        verify(categoriaRepository, never()).save(categoria);
    }

    @Test
    void eliminar_hazSoftDelete_cuandoTieneProductosAsociados() {
        Categoria categoria = Categoria.builder().idCategoria(1L).nombre("Tacos").activa(true).build();
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(productoRepository.existsByIdCategoria(1L)).thenReturn(true);

        categoriaService.eliminar(1L);

        assertThat(categoria.getActiva()).isFalse();
        verify(categoriaRepository).save(categoria);
        verify(categoriaRepository, never()).delete(categoria);
    }
}
