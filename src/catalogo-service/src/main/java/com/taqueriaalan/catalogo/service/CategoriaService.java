package com.taqueriaalan.catalogo.service;

import com.taqueriaalan.catalogo.dto.CategoriaRequest;
import com.taqueriaalan.catalogo.dto.CategoriaResponse;
import java.util.List;

public interface CategoriaService {

    List<CategoriaResponse> listar(Boolean activa);

    CategoriaResponse obtenerPorId(Long idCategoria);

    CategoriaResponse crear(CategoriaRequest request);

    CategoriaResponse actualizar(Long idCategoria, CategoriaRequest request);

    void eliminar(Long idCategoria);
}
