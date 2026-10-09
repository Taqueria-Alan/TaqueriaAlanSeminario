package com.taqueriaalan.catalogo.repository;

import com.taqueriaalan.catalogo.model.Categoria;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    List<Categoria> findByActiva(Boolean activa);
}
