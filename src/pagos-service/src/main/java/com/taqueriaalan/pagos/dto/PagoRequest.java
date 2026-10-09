package com.taqueriaalan.pagos.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.taqueriaalan.pagos.model.MetodoPago;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * numeroTarjetaPrueba es solo una tarjeta de pruebas: no se persiste ni se registra en logs.
 * La demo no solicita ni acepta CVV ni datos de una tarjeta real.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PagoRequest(
        @NotNull Long idPedido,
        @NotNull MetodoPago metodoPago,
        @Size(max = 32) String numeroTarjetaPrueba,
        @Size(max = 100) String titular,
        @Size(max = 64) String idempotencyKey) {
}
