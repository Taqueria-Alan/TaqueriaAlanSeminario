package com.taqueriaalan.clubalan.controller;

import com.taqueriaalan.clubalan.dto.ClienteBusquedaResponse;
import com.taqueriaalan.clubalan.service.ClienteBusquedaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/club-alan/clientes")
@RequiredArgsConstructor
@Tag(name = "Clientes Club Alan", description = "Busqueda de clientes por nombre o telefono")
public class ClienteController {

    private final ClienteBusquedaService clienteBusquedaService;

    @GetMapping("/buscar")
    @Operation(summary = "Buscar clientes por nombre o telefono (minimo 2 caracteres)")
    public ResponseEntity<List<ClienteBusquedaResponse>> buscar(@RequestParam("q") String q) {
        return ResponseEntity.ok(clienteBusquedaService.buscar(q));
    }
}
