package com.taqueriaalan.catalogo.model;

import java.math.BigDecimal;

public interface ProductoConCategoriaProjection {

    Long getIdProducto();

    String getNombre();

    String getDescripcion();

    BigDecimal getPrecio();

    Boolean getDisponible();

    String getNombreCategoria();
}
