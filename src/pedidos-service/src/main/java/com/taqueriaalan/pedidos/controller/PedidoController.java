package com.taqueriaalan.pedidos.controller;

import com.taqueriaalan.pedidos.dto.ActualizarPedidoRequest;
import com.taqueriaalan.pedidos.dto.CancelarPedidoRequest;
import com.taqueriaalan.pedidos.dto.PedidoRequest;
import com.taqueriaalan.pedidos.dto.PedidoResponse;
import com.taqueriaalan.pedidos.service.PedidoService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/pedidos", "/api/v1/pedidos"})
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    @PostMapping
    public ResponseEntity<PedidoResponse> crear(
            @Valid @RequestBody PedidoRequest request,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoService.crear(request, correlation(correlationId)));
    }

    @GetMapping
    public ResponseEntity<List<PedidoResponse>> listar(@RequestParam(required = false) Long idCliente) {
        return ResponseEntity.ok(pedidoService.listar(idCliente));
    }

    @GetMapping("/{idPedido}")
    public ResponseEntity<PedidoResponse> obtener(@PathVariable Long idPedido) {
        return ResponseEntity.ok(pedidoService.obtener(idPedido));
    }

    @PutMapping("/{idPedido}")
    public ResponseEntity<PedidoResponse> actualizar(
            @PathVariable Long idPedido,
            @Valid @RequestBody ActualizarPedidoRequest request,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId) {
        return ResponseEntity.ok(pedidoService.actualizar(idPedido, request, correlation(correlationId)));
    }

    @PostMapping("/{idPedido}/cancelar")
    public ResponseEntity<PedidoResponse> cancelar(
            @PathVariable Long idPedido,
            @RequestBody(required = false) CancelarPedidoRequest request,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId) {
        return ResponseEntity.ok(pedidoService.cancelar(idPedido, request, correlation(correlationId)));
    }

    @PostMapping("/{idPedido}/avanzar")
    public ResponseEntity<PedidoResponse> avanzar(
            @PathVariable Long idPedido,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId) {
        return ResponseEntity.ok(pedidoService.avanzar(idPedido, correlation(correlationId)));
    }

    private String correlation(String correlationId) {
        return correlationId == null || correlationId.isBlank() ? UUID.randomUUID().toString() : correlationId;
    }
}
