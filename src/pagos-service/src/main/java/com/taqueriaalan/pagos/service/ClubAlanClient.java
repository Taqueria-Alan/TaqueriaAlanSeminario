package com.taqueriaalan.pagos.service;

import com.taqueriaalan.pagos.dto.MovimientoRequest;
import com.taqueriaalan.pagos.dto.PuntosResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/** Cliente acotado a las dos operaciones del flujo de pago. */
@Component
@Slf4j
public class ClubAlanClient {

    private final RestClient restClient;
    private final boolean enabled;

    public ClubAlanClient(
            RestClient.Builder builder,
            @Value("${app.club-alan.base-url}") String baseUrl,
            @Value("${app.club-alan.enabled:true}") boolean enabled) {
        this.restClient = builder.baseUrl(baseUrl).build();
        this.enabled = enabled;
    }

    public void activarMembresia(Long idCliente, Long idPedido) {
        if (!enabled) {
            return;
        }
        restClient.post().uri("/api/club-alan/clientes/{idCliente}/membresia", idCliente)
                .retrieve().toBodilessEntity();
        log.info("event=club.activado pedidoId={} clienteId={}", idPedido, idCliente);
    }

    public PuntosResponse obtenerPuntos(Long idCliente) {
        if (!enabled) {
            return new PuntosResponse(idCliente, 0, false);
        }
        return restClient.get().uri("/api/club-alan/clientes/{idCliente}/puntos", idCliente)
                .retrieve().body(PuntosResponse.class);
    }

    public void acumular(Long idCliente, Long idPedido, int puntos) {
        if (!enabled || puntos <= 0) {
            return;
        }
        restClient.post().uri("/api/club-alan/clientes/{idCliente}/movimientos", idCliente)
                .body(new MovimientoRequest("ACUMULACION", puntos, idPedido,
                        "Acumulación automática por pago del pedido #" + idPedido))
                .retrieve().toBodilessEntity();
        log.info("event=puntos.acumulados pedidoId={} clienteId={} puntos={}", idPedido, idCliente, puntos);
    }
}
