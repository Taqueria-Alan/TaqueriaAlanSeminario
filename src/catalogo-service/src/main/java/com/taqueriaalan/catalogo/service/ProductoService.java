package com.taqueriaalan.catalogo.service;

import com.taqueriaalan.catalogo.dto.DisponibilidadRequest;
import com.taqueriaalan.catalogo.dto.ProductoConCategoriaResponse;
import com.taqueriaalan.catalogo.dto.ProductoRequest;
import com.taqueriaalan.catalogo.dto.ProductoResponse;
import java.util.List;

public interface ProductoService {

    List<ProductoResponse> listar(Long idCategoria, Boolean disponible);

    ProductoResponse obtenerPorId(Long idProducto);

    ProductoResponse crear(ProductoRequest request);

    ProductoResponse actualizar(Long idProducto, ProductoRequest request);

    ProductoResponse actualizarDisponibilidad(Long idProducto, DisponibilidadRequest request);

    void eliminar(Long idProducto);

    List<ProductoConCategoriaResponse> listarConCategoria();
}
