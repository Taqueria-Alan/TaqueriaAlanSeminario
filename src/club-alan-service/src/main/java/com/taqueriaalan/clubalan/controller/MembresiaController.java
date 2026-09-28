package com.taqueriaalan.clubalan.controller;

import com.taqueriaalan.clubalan.dto.MembresiaResponse;
import com.taqueriaalan.clubalan.service.MembresiaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/club-alan/clientes")
@RequiredArgsConstructor
@Tag(name = "Membresia Club Alan", description = "Alta, consulta y cancelacion de la membresia del club de lealtad")
public class MembresiaController {

    private final MembresiaService membresiaService;

    @PostMapping("/{idCliente}/membresia")
    @Operation(summary = "Activar la membresia Club Alan de un cliente")
    public ResponseEntity<MembresiaResponse> activar(@PathVariable Long idCliente) {
        MembresiaResponse response = membresiaService.activar(idCliente);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{idCliente}/membresia")
    @Operation(summary = "Consultar el estado actual de la membresia de un cliente")
    public ResponseEntity<MembresiaResponse> obtenerEstado(@PathVariable Long idCliente) {
        return ResponseEntity.ok(membresiaService.obtenerEstado(idCliente));
    }

    @DeleteMapping("/{idCliente}/membresia")
    @Operation(summary = "Cancelar la membresia activa de un cliente")
    public ResponseEntity<Void> cancelar(@PathVariable Long idCliente) {
        membresiaService.cancelar(idCliente);
        return ResponseEntity.noContent().build();
    }
}
