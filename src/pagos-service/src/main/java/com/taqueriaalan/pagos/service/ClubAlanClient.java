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

    private static final String INTERNAL_SECRET_HEADER = "X-Internal-Secret";

    private final RestClient restClient;
    private final boolean enabled;
    private final String internalSecret;

    public ClubAlanClient(
            RestClient.Builder builder,
            @Value("${app.club-alan.base-url}") String baseUrl,
            @Value("${app.club-alan.enabled:true}") boolean enabled,
            @Value("${app.club-alan.internal-secret:}") String internalSecret) {
        this.restClient = builder.baseUrl(baseUrl).build();
        this.enabled = enabled;
        this.internalSecret = internalSecret;
    }

    public void activarMembresia(Long idCliente, Long idPedido) {
        if (!enabled) {
            return;
        }
        restClient.post().uri("/api/club-alan/clientes/{idCliente}/membresia", idCliente)
                .header(INTERNAL_SECRET_HEADER, internalSecret)
                .retrieve().toBodilessEntity();
        log.info("event=club.activado pedidoId={} clienteId={}", idPedido, idCliente);
    }

    public PuntosResponse obtenerPuntos(Long idCliente) {
        if (!enabled) {
            return new PuntosResponse(idCliente, 0, false);
        }
        return restClient.get().uri("/api/club-alan/clientes/{idCliente}/puntos", idCliente)
                .header(INTERNAL_SECRET_HEADER, internalSecret)
                .retrieve().body(PuntosResponse.class);
    }

    public void acumular(Long idCliente, Long idPedido, int puntos) {
        if (!enabled || puntos <= 0) {
            return;
        }
        restClient.post().uri("/api/club-alan/clientes/{idCliente}/movimientos", idCliente)
                .header(INTERNAL_SECRET_HEADER, internalSecret)
                .body(new MovimientoRequest("ACUMULACION", puntos, idPedido,
                        "Acumulación automática por pago del pedido #" + idPedido))
                .retrieve().toBodilessEntity();
        log.info("event=puntos.acumulados pedidoId={} clienteId={} puntos={}", idPedido, idCliente, puntos);
    }
}
