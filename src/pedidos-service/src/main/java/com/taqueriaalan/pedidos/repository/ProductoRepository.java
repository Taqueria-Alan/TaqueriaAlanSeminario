package com.taqueriaalan.pedidos.repository;

import com.taqueriaalan.pedidos.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
}
