package com.taqueriaalan.catalogo.controller;

import com.taqueriaalan.catalogo.dto.CategoriaRequest;
import com.taqueriaalan.catalogo.dto.CategoriaResponse;
import com.taqueriaalan.catalogo.service.CategoriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/catalogo/categorias")
@RequiredArgsConstructor
@Tag(name = "Categorias", description = "CRUD de categorias del catalogo")
public class CategoriaController {

    private final CategoriaService categoriaService;

    @GetMapping
    @Operation(summary = "Listar categorias, opcionalmente filtradas por estado activa")
    public ResponseEntity<List<CategoriaResponse>> listar(
            @RequestParam(required = false) Boolean activa) {
        return ResponseEntity.ok(categoriaService.listar(activa));
    }

    @GetMapping("/{idCategoria}")
    @Operation(summary = "Obtener una categoria por id")
    public ResponseEntity<CategoriaResponse> obtenerPorId(@PathVariable Long idCategoria) {
        return ResponseEntity.ok(categoriaService.obtenerPorId(idCategoria));
    }

    @PostMapping
    @Operation(summary = "Crear una categoria")
    public ResponseEntity<CategoriaResponse> crear(@Valid @RequestBody CategoriaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaService.crear(request));
    }

    @PutMapping("/{idCategoria}")
    @Operation(summary = "Actualizar una categoria")
    public ResponseEntity<CategoriaResponse> actualizar(
            @PathVariable Long idCategoria, @Valid @RequestBody CategoriaRequest request) {
        return ResponseEntity.ok(categoriaService.actualizar(idCategoria, request));
    }

    @DeleteMapping("/{idCategoria}")
    @Operation(summary = "Eliminar una categoria (soft delete si tiene productos asociados)")
    public ResponseEntity<Void> eliminar(@PathVariable Long idCategoria) {
        categoriaService.eliminar(idCategoria);
        return ResponseEntity.noContent().build();
    }
}
