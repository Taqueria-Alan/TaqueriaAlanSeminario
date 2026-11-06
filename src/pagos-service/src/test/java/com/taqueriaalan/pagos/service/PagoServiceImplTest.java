package com.taqueriaalan.pagos.service;

import com.taqueriaalan.pagos.dto.PagoRequest;
import com.taqueriaalan.pagos.exception.*;
import com.taqueriaalan.pagos.model.*;
import com.taqueriaalan.pagos.repository.*;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PagoServiceImplTest {
    @Mock PagoRepository pagos;
    @Mock PedidoRepository pedidos;
    @Mock ApplicationEventPublisher eventos;
    PagoServiceImpl servicio;
    Pedido pedido;

    @BeforeEach void setup() {
        servicio = new PagoServiceImpl(pagos, pedidos, eventos);
        pedido = new Pedido();
        pedido.setIdPedido(9L);
        pedido.setIdCliente(7L);
        pedido.setIdTipoPedido(1L);
        pedido.setTotal(new BigDecimal("18.00"));
        pedido.setEstado(EstadoPedido.RECIBIDO);
    }

    private void existePedido() { when(pedidos.findByIdForUpdate(9L)).thenReturn(Optional.of(pedido)); }
    private PagoRequest tarjeta(String numero) { return new PagoRequest(9L, MetodoPago.TARJETA, numero, "Demo", "clave"); }

    @Test void noCobraPedidoInexistente() {
        assertThatThrownBy(() -> servicio.procesar(tarjeta("4242424242424242"), null, "qa", 7L, "CLIENTE"))
                .isInstanceOf(ResourceNotFoundException.class);
        verifyNoInteractions(pagos, eventos);
    }

    @Test void clienteNoPuedePagarPedidoAjeno() {
        existePedido();
        assertThatThrownBy(() -> servicio.procesar(tarjeta("4242424242424242"), null, "qa", 8L, "CLIENTE"))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.getCode()).isEqualTo("ACCESO_DENEGADO"));
        verifyNoInteractions(pagos, eventos);
    }

    @Test void pedidoCanceladoNoSeCobra() {
        existePedido();
        pedido.setEstado(EstadoPedido.CANCELADO);
        assertThatThrownBy(() -> servicio.procesar(tarjeta("4242424242424242"), null, "qa", 7L, "CLIENTE"))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.getCode()).isEqualTo("PAGO_NO_PERMITIDO"));
        verify(pagos, never()).save(any());
    }

    @Test void tarjetaInvalidaNoAvanzaElPedido() {
        existePedido();
        assertThatThrownBy(() -> servicio.procesar(tarjeta("123"), null, "qa", 7L, "CLIENTE"))
                .isInstanceOfSatisfying(PaymentDeclinedException.class, e -> assertThat(e.getCode()).isEqualTo("TARJETA_INVALIDA"));
        assertThat(pedido.getEstado()).isEqualTo(EstadoPedido.RECIBIDO);
        verify(pagos).save(argThat(p -> p.getEstadoPago() == EstadoPago.RECHAZADO));
        verifyNoInteractions(eventos);
    }

    @Test void fondosInsuficientesRegistranRechazo() {
        existePedido();
        assertThatThrownBy(() -> servicio.procesar(tarjeta("4000000000000002"), null, "qa", 7L, "CLIENTE"))
                .isInstanceOfSatisfying(PaymentDeclinedException.class, e -> assertThat(e.getCode()).isEqualTo("FONDOS_INSUFICIENTES"));
        verify(pagos).save(argThat(p -> p.getEstadoPago() == EstadoPago.RECHAZADO));
        verify(pedidos, never()).save(any());
    }

    @Test void apruebaConTotalDelPedidoYEmiteEvento() {
        existePedido();
        when(pagos.save(any())).thenAnswer(i -> i.getArgument(0));
        var r = servicio.procesar(tarjeta("4242 4242 4242 4242"), " clave-cabecera ", "qa", 7L, "CLIENTE");
        assertThat(r.monto()).isEqualByComparingTo("18.00");
        assertThat(r.estadoPago()).isEqualTo(EstadoPago.APROBADO);
        assertThat(r.pedidoEstado()).isEqualTo(EstadoPedido.EN_PREPARACION);
        verify(pagos).save(argThat(p -> "clave-cabecera".equals(p.getIdempotencyKey())));
        verify(eventos).publishEvent(any(PagoAprobadoEvent.class));
    }

    @Test void pagoDeSuscripcionFinalizaSinPreparacion() {
        existePedido();
        pedido.setIdTipoPedido(2L);
        when(pagos.save(any())).thenAnswer(i -> i.getArgument(0));
        var r = servicio.procesar(tarjeta("4242424242424242"), null, "qa", 7L, "CLIENTE");
        assertThat(r.pedidoEstado()).isEqualTo(EstadoPedido.ENTREGADO);
    }

    @Test void mismaClaveNoDuplicaCobroNiEvento() {
        existePedido();
        var pago = new Pago();
        pago.setEstadoPago(EstadoPago.APROBADO);
        when(pagos.findByIdPedidoAndIdempotencyKey(9L, "clave")).thenReturn(Optional.of(pago));
        assertThat(servicio.procesar(tarjeta("4242424242424242"), null, "qa", 7L, "CLIENTE").idempotente()).isTrue();
        verify(pagos, never()).save(any());
        verifyNoInteractions(eventos);
    }

    @Test void consultaSinPagoDevuelveErrorDeDominio() {
        when(pedidos.findById(9L)).thenReturn(Optional.of(pedido));
        assertThatThrownBy(() -> servicio.obtenerPorPedido(9L, 7L, "CLIENTE")).isInstanceOf(ResourceNotFoundException.class);
    }
}
