package com.taqueriaalan.catalogo.controller;

import com.taqueriaalan.catalogo.dto.DisponibilidadRequest;
import com.taqueriaalan.catalogo.dto.ProductoConCategoriaResponse;
import com.taqueriaalan.catalogo.dto.ProductoRequest;
import com.taqueriaalan.catalogo.dto.ProductoResponse;
import com.taqueriaalan.catalogo.service.ProductoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/catalogo/productos")
@RequiredArgsConstructor
@Tag(name = "Productos", description = "CRUD de productos del catalogo")
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    @Operation(summary = "Listar productos, opcionalmente filtrados por categoria y disponibilidad")
    public ResponseEntity<List<ProductoResponse>> listar(
            @RequestParam(required = false) Long idCategoria,
            @RequestParam(required = false) Boolean disponible) {
        return ResponseEntity.ok(productoService.listar(idCategoria, disponible));
    }

    @GetMapping("/con-categoria")
    @Operation(summary = "Listar productos junto con el nombre de su categoria (vw_ProductosCategorias)")
    public ResponseEntity<List<ProductoConCategoriaResponse>> listarConCategoria() {
        return ResponseEntity.ok(productoService.listarConCategoria());
    }

    @GetMapping("/{idProducto}")
    @Operation(summary = "Obtener un producto por id")
    public ResponseEntity<ProductoResponse> obtenerPorId(@PathVariable Long idProducto) {
        return ResponseEntity.ok(productoService.obtenerPorId(idProducto));
    }

    @PostMapping
    @Operation(summary = "Crear un producto")
    public ResponseEntity<ProductoResponse> crear(@Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productoService.crear(request));
    }

    @PutMapping("/{idProducto}")
    @Operation(summary = "Actualizar un producto")
    public ResponseEntity<ProductoResponse> actualizar(
            @PathVariable Long idProducto, @Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.ok(productoService.actualizar(idProducto, request));
    }

    @PatchMapping("/{idProducto}/disponibilidad")
    @Operation(summary = "Cambiar solo la disponibilidad de un producto")
    public ResponseEntity<ProductoResponse> actualizarDisponibilidad(
            @PathVariable Long idProducto, @Valid @RequestBody DisponibilidadRequest request) {
        return ResponseEntity.ok(productoService.actualizarDisponibilidad(idProducto, request));
    }

    @DeleteMapping("/{idProducto}")
    @Operation(summary = "Eliminar un producto")
    public ResponseEntity<Void> eliminar(@PathVariable Long idProducto) {
        productoService.eliminar(idProducto);
        return ResponseEntity.noContent().build();
    }
}
