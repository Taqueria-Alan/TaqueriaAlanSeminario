package com.taqueriaalan.pagos.controller;

import com.taqueriaalan.pagos.dto.PagoRequest;
import com.taqueriaalan.pagos.dto.PagoResponse;
import com.taqueriaalan.pagos.service.PagoService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/pagos", "/api/v1/pagos"})
@RequiredArgsConstructor
public class PagoController {

    private final PagoService pagoService;

    @PostMapping
    public ResponseEntity<PagoResponse> procesar(
            @Valid @RequestBody PagoRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId,
            HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pagoService.procesar(request, idempotencyKey, correlation(correlationId),
                        idCliente(httpRequest), rol(httpRequest)));
    }

    @GetMapping("/{idPedido}")
    public ResponseEntity<PagoResponse> obtener(@PathVariable Long idPedido, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(pagoService.obtenerPorPedido(idPedido, idCliente(httpRequest), rol(httpRequest)));
    }

    private Long idCliente(HttpServletRequest request) {
        return (Long) request.getAttribute("idCliente");
    }

    private String rol(HttpServletRequest request) {
        return (String) request.getAttribute("rol");
    }

    private String correlation(String correlationId) {
        return correlationId == null || correlationId.isBlank() ? UUID.randomUUID().toString() : correlationId;
    }
}
