package com.taqueriaalan.pagos.service;

import com.taqueriaalan.pagos.dto.PuntosResponse;
import java.math.RoundingMode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Coordina Club Alan una vez liberados los bloqueos de la transacción de pago. */
@Component
@RequiredArgsConstructor
@Slf4j
public class ClubAlanPaymentListener {

    private final ClubAlanClient clubAlanClient;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void procesar(PagoAprobadoEvent event) {
        try {
            if (event.suscripcion()) {
                clubAlanClient.activarMembresia(event.idCliente(), event.idPedido());
                return;
            }
            PuntosResponse puntos = clubAlanClient.obtenerPuntos(event.idCliente());
            int porAcumular = event.monto().divide(java.math.BigDecimal.TEN, 0, RoundingMode.FLOOR).intValue();
            if (Boolean.TRUE.equals(puntos.miembroClub()) && porAcumular > 0) {
                clubAlanClient.acumular(event.idCliente(), event.idPedido(), porAcumular);
            }
        } catch (Exception error) {
            // Un problema temporal de lealtad no revierte un pago ya confirmado.
            log.warn("event=club.pendiente correlationId={} pedidoId={} reason={}", event.correlationId(),
                    event.idPedido(), error.getClass().getSimpleName());
        }
    }
}
