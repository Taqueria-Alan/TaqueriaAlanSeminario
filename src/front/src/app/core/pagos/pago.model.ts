import { EstadoPedido } from '../pedidos/pedido.model';

export type MetodoPago = 'TARJETA';
export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface SolicitudPago {
  idPedido: number;
  metodoPago: MetodoPago;
  /** PAN de simulación: nunca se persiste en el navegador. */
  numeroTarjetaPrueba: string;
  titular: string;
  idempotencyKey?: string;
}

export interface ResultadoPago {
  idPago?: number;
  idPedido: number;
  estadoPago: EstadoPago;
  pedidoEstado?: EstadoPedido;
  referencia?: string;
  mensaje?: string;
}
