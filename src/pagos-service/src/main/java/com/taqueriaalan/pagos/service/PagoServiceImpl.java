package com.taqueriaalan.pagos.service;

import com.taqueriaalan.pagos.dto.PagoRequest;
import com.taqueriaalan.pagos.dto.PagoResponse;
import com.taqueriaalan.pagos.exception.BusinessException;
import com.taqueriaalan.pagos.exception.PaymentDeclinedException;
import com.taqueriaalan.pagos.exception.ResourceNotFoundException;
import com.taqueriaalan.pagos.model.EstadoPago;
import com.taqueriaalan.pagos.model.EstadoPedido;
import com.taqueriaalan.pagos.model.Pago;
import com.taqueriaalan.pagos.model.Pedido;
import com.taqueriaalan.pagos.repository.PagoRepository;
import com.taqueriaalan.pagos.repository.PedidoRepository;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class PagoServiceImpl implements PagoService {

    private static final long TIPO_SUSCRIPCION = 2L;

    private final PagoRepository pagoRepository;
    private final PedidoRepository pedidoRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(noRollbackFor = PaymentDeclinedException.class)
    public PagoResponse procesar(PagoRequest request, String requestedKey, String correlationId) {
        String idempotencyKey = normalizarClave(requestedKey, request.idempotencyKey());
        Pedido pedido = pedidoRepository.findByIdForUpdate(request.idPedido())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el pedido " + request.idPedido()));
        Pago previoPorClave = pagoRepository.findByIdPedidoAndIdempotencyKey(pedido.getIdPedido(), idempotencyKey)
                .orElse(null);
        if (previoPorClave != null) {
            log.info("event=pago.idempotente correlationId={} pedidoId={} pagoId={} estado={}",
                    correlationId, pedido.getIdPedido(), previoPorClave.getIdPago(), previoPorClave.getEstadoPago());
            if (previoPorClave.getEstadoPago() == EstadoPago.RECHAZADO) {
                throw new PaymentDeclinedException(previoPorClave.getCodigoResultado(), previoPorClave.getMotivoRechazo());
            }
            return toResponse(previoPorClave, pedido, true);
        }

        Pago aprobadoExistente = pagoRepository.findFirstByIdPedidoAndEstadoPagoOrderByIdPagoDesc(
                pedido.getIdPedido(), EstadoPago.APROBADO).orElse(null);
        if (aprobadoExistente != null) {
            log.info("event=pago.ya_aprobado correlationId={} pedidoId={} pagoId={}",
                    correlationId, pedido.getIdPedido(), aprobadoExistente.getIdPago());
            return toResponse(aprobadoExistente, pedido, true);
        }
        if (pedido.getEstado() != EstadoPedido.RECIBIDO) {
            throw new BusinessException("PAGO_NO_PERMITIDO",
                    "Solo un pedido recibido puede procesar un pago", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        validarTarjetaDePrueba(request, pedido, idempotencyKey, correlationId);
        Pago pago = nuevoPago(pedido, request, idempotencyKey, EstadoPago.APROBADO, "APROBADO", null);
        pago.setReferencia("DEMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        Pago guardado = pagoRepository.save(pago);

        boolean suscripcion = Long.valueOf(TIPO_SUSCRIPCION).equals(pedido.getIdTipoPedido());
        pedido.setEstado(suscripcion ? EstadoPedido.ENTREGADO : EstadoPedido.EN_PREPARACION);
        pedidoRepository.save(pedido);
        log.info("event=pago.aprobado correlationId={} pedidoId={} pagoId={} monto={} pedidoEstado={}",
                correlationId, pedido.getIdPedido(), guardado.getIdPago(), guardado.getMonto(), pedido.getEstado());

        eventPublisher.publishEvent(new PagoAprobadoEvent(
                pedido.getIdPedido(), pedido.getIdCliente(), pedido.getTotal(), suscripcion, correlationId));
        return toResponse(guardado, pedido, false);
    }

    @Override
    @Transactional(readOnly = true)
    public PagoResponse obtenerPorPedido(Long idPedido) {
        Pedido pedido = obtenerPedido(idPedido);
        Pago pago = pagoRepository.findFirstByIdPedidoOrderByIdPagoDesc(idPedido)
                .orElseThrow(() -> new ResourceNotFoundException("No existe un pago para el pedido " + idPedido));
        return toResponse(pago, pedido, false);
    }

    private void validarTarjetaDePrueba(PagoRequest request, Pedido pedido, String idempotencyKey, String correlationId) {
        if (request.metodoPago() != com.taqueriaalan.pagos.model.MetodoPago.TARJETA) {
            return;
        }
        String digits = request.numeroTarjetaPrueba() == null ? ""
                : request.numeroTarjetaPrueba().replaceAll("[^0-9]", "");
        if (!esTarjetaValida(digits)) {
            rechazar(pedido, request, idempotencyKey, "TARJETA_INVALIDA",
                    "La tarjeta de prueba no tiene un formato válido", correlationId);
        }
        if (digits.endsWith("0002")) {
            rechazar(pedido, request, idempotencyKey, "FONDOS_INSUFICIENTES",
                    "La tarjeta de prueba no tiene fondos suficientes", correlationId);
        }
    }

    private void rechazar(Pedido pedido, PagoRequest request, String idempotencyKey, String code, String message,
            String correlationId) {
        Pago rechazo = nuevoPago(pedido, request, idempotencyKey, EstadoPago.RECHAZADO, code, message);
        rechazo.setReferencia("DEMO-RECHAZADO");
        pagoRepository.save(rechazo);
        log.warn("event=pago.rechazado correlationId={} pedidoId={} codigo={}", correlationId, pedido.getIdPedido(), code);
        throw new PaymentDeclinedException(code, message);
    }

    private Pago nuevoPago(Pedido pedido, PagoRequest request, String idempotencyKey, EstadoPago estado,
            String code, String motive) {
        Pago pago = new Pago();
        pago.setIdPedido(pedido.getIdPedido());
        pago.setFechaPago(LocalDateTime.now());
        pago.setActualizadoEn(LocalDateTime.now());
        pago.setMonto(pedido.getTotal());
        pago.setMetodoPago(request.metodoPago());
        pago.setEstadoPago(estado);
        pago.setIdempotencyKey(idempotencyKey);
        pago.setCodigoResultado(code);
        pago.setMotivoRechazo(motive);
        return pago;
    }

    private Pedido obtenerPedido(Long idPedido) {
        return pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el pedido " + idPedido));
    }

    private PagoResponse toResponse(Pago pago, Pedido pedido, boolean idempotente) {
        return new PagoResponse(pago.getIdPago(), pago.getIdPedido(), pago.getMonto(), pago.getMetodoPago(),
                pago.getEstadoPago(), pago.getCodigoResultado(), pago.getReferencia(), pedido.getEstado(),
                pago.getFechaPago(), idempotente);
    }

    private String normalizarClave(String header, String body) {
        String candidate = StringUtils.hasText(header) ? header : body;
        return StringUtils.hasText(candidate) && candidate.trim().length() <= 64
                ? candidate.trim() : UUID.randomUUID().toString();
    }

    private boolean esTarjetaValida(String digits) {
        if (!digits.matches("\\d{16}")) {
            return false;
        }
        int sum = 0;
        boolean duplicate = false;
        for (int index = digits.length() - 1; index >= 0; index--) {
            int digit = digits.charAt(index) - '0';
            if (duplicate) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
            duplicate = !duplicate;
        }
        return sum % 10 == 0;
    }
}
