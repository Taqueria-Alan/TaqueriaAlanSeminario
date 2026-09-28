package com.taqueriaalan.catalogo.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductoResponse {

    private Long idProducto;
    private Long idCategoria;
    private String nombre;
    private String descripcion;
    private BigDecimal precio;
    private Boolean disponible;
}
