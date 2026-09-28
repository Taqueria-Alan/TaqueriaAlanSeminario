package com.taqueriaalan.clubalan.controller;

import com.taqueriaalan.clubalan.dto.MovimientoRequest;
import com.taqueriaalan.clubalan.dto.MovimientoResponse;
import com.taqueriaalan.clubalan.dto.PuntosResponse;
import com.taqueriaalan.clubalan.service.PuntosService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/club-alan/clientes")
@RequiredArgsConstructor
@Tag(name = "Puntos Club Alan", description = "Saldo y movimientos de puntos del programa de lealtad")
public class PuntosController {

    private final PuntosService puntosService;

    @GetMapping("/{idCliente}/puntos")
    @Operation(summary = "Obtener el saldo de puntos y estado de membresia de un cliente")
    public ResponseEntity<PuntosResponse> obtenerSaldo(@PathVariable Long idCliente) {
        return ResponseEntity.ok(puntosService.obtenerSaldo(idCliente));
    }

    @PostMapping("/{idCliente}/movimientos")
    @Operation(summary = "Registrar un movimiento de puntos (acumulacion o canje)")
    public ResponseEntity<MovimientoResponse> registrarMovimiento(
            @PathVariable Long idCliente,
            @Valid @RequestBody MovimientoRequest request) {
        MovimientoResponse response = puntosService.registrarMovimiento(idCliente, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{idCliente}/movimientos")
    @Operation(summary = "Historial paginado de movimientos de puntos de un cliente")
    public ResponseEntity<Page<MovimientoResponse>> listarMovimientos(
            @PathVariable Long idCliente, Pageable pageable) {
        return ResponseEntity.ok(puntosService.listarMovimientos(idCliente, pageable));
    }
}
