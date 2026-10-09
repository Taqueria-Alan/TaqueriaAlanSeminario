package com.taqueriaalan.pagos.exception;

import org.springframework.http.HttpStatus;

/** Deja trazabilidad del rechazo sin tratarlo como un fallo 5xx. */
public class PaymentDeclinedException extends BusinessException {

    public PaymentDeclinedException(String code, String message) {
        super(code, message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
