package com.taqueriaalan.catalogo.service;

import com.taqueriaalan.catalogo.dto.DisponibilidadRequest;
import com.taqueriaalan.catalogo.dto.ProductoConCategoriaResponse;
import com.taqueriaalan.catalogo.dto.ProductoRequest;
import com.taqueriaalan.catalogo.dto.ProductoResponse;
import com.taqueriaalan.catalogo.exception.ResourceNotFoundException;
import com.taqueriaalan.catalogo.model.Producto;
import com.taqueriaalan.catalogo.model.ProductoConCategoriaProjection;
import com.taqueriaalan.catalogo.repository.ProductoRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponse> listar(Long idCategoria, Boolean disponible) {
        List<Producto> productos;
        if (idCategoria != null && disponible != null) {
            productos = productoRepository.findByIdCategoriaAndDisponible(idCategoria, disponible);
        } else if (idCategoria != null) {
            productos = productoRepository.findByIdCategoria(idCategoria);
        } else if (disponible != null) {
            productos = productoRepository.findByDisponible(disponible);
        } else {
            productos = productoRepository.findAll();
        }
        return productos.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoResponse obtenerPorId(Long idProducto) {
        return toResponse(obtenerProductoOrThrow(idProducto));
    }

    @Override
    @Transactional
    public ProductoResponse crear(ProductoRequest request) {
        Producto producto = Producto.builder()
                .idCategoria(request.getIdCategoria())
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .precio(request.getPrecio())
                .disponible(request.getDisponible() == null ? true : request.getDisponible())
                .build();
        return toResponse(productoRepository.save(producto));
    }

    @Override
    @Transactional
    public ProductoResponse actualizar(Long idProducto, ProductoRequest request) {
        Producto producto = obtenerProductoOrThrow(idProducto);
        producto.setIdCategoria(request.getIdCategoria());
        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        if (request.getDisponible() != null) {
            producto.setDisponible(request.getDisponible());
        }
        return toResponse(productoRepository.save(producto));
    }

    @Override
    @Transactional
    public ProductoResponse actualizarDisponibilidad(Long idProducto, DisponibilidadRequest request) {
        Producto producto = obtenerProductoOrThrow(idProducto);
        producto.setDisponible(request.getDisponible());
        return toResponse(productoRepository.save(producto));
    }

    @Override
    @Transactional
    public void eliminar(Long idProducto) {
        Producto producto = obtenerProductoOrThrow(idProducto);
        productoRepository.delete(producto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoConCategoriaResponse> listarConCategoria() {
        return productoRepository.findProductosConCategoria().stream()
                .map(this::toResponse)
                .toList();
    }

    private Producto obtenerProductoOrThrow(Long idProducto) {
        return productoRepository.findById(idProducto)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontro el producto con id " + idProducto));
    }

    private ProductoResponse toResponse(Producto producto) {
        return ProductoResponse.builder()
                .idProducto(producto.getIdProducto())
                .idCategoria(producto.getIdCategoria())
                .nombre(producto.getNombre())
                .descripcion(producto.getDescripcion())
                .precio(producto.getPrecio())
                .disponible(producto.getDisponible())
                .build();
    }

    private ProductoConCategoriaResponse toResponse(ProductoConCategoriaProjection projection) {
        return ProductoConCategoriaResponse.builder()
                .idProducto(projection.getIdProducto())
                .nombre(projection.getNombre())
                .descripcion(projection.getDescripcion())
                .precio(projection.getPrecio())
                .disponible(projection.getDisponible())
                .nombreCategoria(projection.getNombreCategoria())
                .build();
    }
}
