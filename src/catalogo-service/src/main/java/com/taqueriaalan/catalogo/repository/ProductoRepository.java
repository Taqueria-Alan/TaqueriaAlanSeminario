package com.taqueriaalan.catalogo.repository;

import com.taqueriaalan.catalogo.model.Producto;
import com.taqueriaalan.catalogo.model.ProductoConCategoriaProjection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByIdCategoria(Long idCategoria);

    List<Producto> findByDisponible(Boolean disponible);

    List<Producto> findByIdCategoriaAndDisponible(Long idCategoria, Boolean disponible);

    boolean existsByIdCategoria(Long idCategoria);

    @Query(value = "SELECT id_producto AS idProducto, nombre_producto AS nombre, "
            + "categoria AS nombreCategoria, descripcion AS descripcion, "
            + "precio AS precio, disponible AS disponible FROM vw_ProductosCategorias",
            nativeQuery = true)
    List<ProductoConCategoriaProjection> findProductosConCategoria();
}
