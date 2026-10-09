package com.taqueriaalan.catalogo.service;

import com.taqueriaalan.catalogo.dto.CategoriaRequest;
import com.taqueriaalan.catalogo.dto.CategoriaResponse;
import com.taqueriaalan.catalogo.exception.ResourceNotFoundException;
import com.taqueriaalan.catalogo.model.Categoria;
import com.taqueriaalan.catalogo.repository.CategoriaRepository;
import com.taqueriaalan.catalogo.repository.ProductoRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoriaServiceImpl implements CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoriaResponse> listar(Boolean activa) {
        List<Categoria> categorias = activa == null
                ? categoriaRepository.findAll()
                : categoriaRepository.findByActiva(activa);
        return categorias.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoriaResponse obtenerPorId(Long idCategoria) {
        return toResponse(obtenerCategoriaOrThrow(idCategoria));
    }

    @Override
    @Transactional
    public CategoriaResponse crear(CategoriaRequest request) {
        Categoria categoria = Categoria.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .activa(request.getActiva() == null ? true : request.getActiva())
                .build();
        return toResponse(categoriaRepository.save(categoria));
    }

    @Override
    @Transactional
    public CategoriaResponse actualizar(Long idCategoria, CategoriaRequest request) {
        Categoria categoria = obtenerCategoriaOrThrow(idCategoria);
        categoria.setNombre(request.getNombre());
        categoria.setDescripcion(request.getDescripcion());
        if (request.getActiva() != null) {
            categoria.setActiva(request.getActiva());
        }
        return toResponse(categoriaRepository.save(categoria));
    }

    @Override
    @Transactional
    public void eliminar(Long idCategoria) {
        Categoria categoria = obtenerCategoriaOrThrow(idCategoria);
        if (productoRepository.existsByIdCategoria(idCategoria)) {
            categoria.setActiva(false);
            categoriaRepository.save(categoria);
        } else {
            categoriaRepository.delete(categoria);
        }
    }

    private Categoria obtenerCategoriaOrThrow(Long idCategoria) {
        return categoriaRepository.findById(idCategoria)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontro la categoria con id " + idCategoria));
    }

    private CategoriaResponse toResponse(Categoria categoria) {
        return CategoriaResponse.builder()
                .idCategoria(categoria.getIdCategoria())
                .nombre(categoria.getNombre())
                .descripcion(categoria.getDescripcion())
                .activa(categoria.getActiva())
                .build();
    }
}
