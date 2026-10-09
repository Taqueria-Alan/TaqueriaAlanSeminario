package com.taqueriaalan.pedidos.model;

/** Estados visibles del ciclo de vida de una orden. */
public enum EstadoPedido {
    RECIBIDO,
    EN_PREPARACION,
    EN_RUTA,
    ENTREGADO,
    /** Estado terminal de auditoría para cancelaciones previas al pago. */
    CANCELADO
}
