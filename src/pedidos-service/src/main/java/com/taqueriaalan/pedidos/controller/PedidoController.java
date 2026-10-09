package com.taqueriaalan.pedidos.controller;

import com.taqueriaalan.pedidos.dto.ActualizarPedidoRequest;
import com.taqueriaalan.pedidos.dto.CancelarPedidoRequest;
import com.taqueriaalan.pedidos.dto.PedidoRequest;
import com.taqueriaalan.pedidos.dto.PedidoResponse;
import com.taqueriaalan.pedidos.exception.BusinessException;
import com.taqueriaalan.pedidos.service.PedidoService;
import jakarta.servlet.http.HttpServletRequest;
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

    private static final String ROL_ADMIN = "ADMIN";
    private static final String ROL_CLIENTE = "CLIENTE";

    private final PedidoService pedidoService;

    @PostMapping
    public ResponseEntity<PedidoResponse> crear(
            @Valid @RequestBody PedidoRequest request,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId,
            HttpServletRequest httpRequest) {
        // Nunca se confia en el idCliente que manda el navegador: si hay sesion de
        // CLIENTE, el pedido siempre se crea a su propio nombre.
        PedidoRequest efectivo = ROL_CLIENTE.equals(rol(httpRequest))
                ? new PedidoRequest(idCliente(httpRequest), request.tipo(), request.clase(), request.direccion(),
                        request.observaciones(), request.lineas())
                : request;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pedidoService.crear(efectivo, correlation(correlationId)));
    }

    @GetMapping
    public ResponseEntity<List<PedidoResponse>> listar(
            @RequestParam(required = false) Long idCliente, HttpServletRequest httpRequest) {
        Long filtro = ROL_CLIENTE.equals(rol(httpRequest)) ? idCliente(httpRequest) : idCliente;
        return ResponseEntity.ok(pedidoService.listar(filtro));
    }

    @GetMapping("/{idPedido}")
    public ResponseEntity<PedidoResponse> obtener(@PathVariable Long idPedido, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(pedidoService.obtener(idPedido, idCliente(httpRequest), rol(httpRequest)));
    }

    @PutMapping("/{idPedido}")
    public ResponseEntity<PedidoResponse> actualizar(
            @PathVariable Long idPedido,
            @Valid @RequestBody ActualizarPedidoRequest request,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(pedidoService.actualizar(idPedido, request, correlation(correlationId),
                idCliente(httpRequest), rol(httpRequest)));
    }

    @PostMapping("/{idPedido}/cancelar")
    public ResponseEntity<PedidoResponse> cancelar(
            @PathVariable Long idPedido,
            @RequestBody(required = false) CancelarPedidoRequest request,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(pedidoService.cancelar(idPedido, request, correlation(correlationId),
                idCliente(httpRequest), rol(httpRequest)));
    }

    @PostMapping("/{idPedido}/avanzar")
    public ResponseEntity<PedidoResponse> avanzar(
            @PathVariable Long idPedido,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId,
            HttpServletRequest httpRequest) {
        // Avanzar el flujo (cocina/reparto) es una accion de administracion, nunca del cliente.
        String rol = rol(httpRequest);
        if (rol != null && !ROL_ADMIN.equals(rol)) {
            throw new BusinessException("ACCESO_DENEGADO", "Solo un administrador puede avanzar un pedido",
                    HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(pedidoService.avanzar(idPedido, correlation(correlationId)));
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
