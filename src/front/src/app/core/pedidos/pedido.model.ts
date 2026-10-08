/**
 * Estados del ciclo de pedido. CANCELADO es terminal y solo se permite antes del pago.
 * Se escriben con guion bajo (EN_PREPARACION, EN_RUTA); si el back guarda el texto con
 * espacios, el ajuste va solo en este archivo.
 */
export type EstadoPedido = 'RECIBIDO' | 'EN_PREPARACION' | 'EN_RUTA' | 'ENTREGADO' | 'CANCELADO';
/** Modalidad del pedido: PEDIDO.modalidad. */
export type TipoPedido = 'LLEVAR' | 'DOMICILIO';
/** Clase de pedido: PEDIDO.id_tipo_pedido (TIPO_PEDIDO). SUSCRIPCION vende la membresia Club Alan. */
export type ClasePedido = 'NORMAL' | 'SUSCRIPCION';

export interface LineaPedido {
  idProducto: number;
  nombre: string;
  detalle: string;
  precio: number;
  cantidad: number;
  observaciones?: string | null;
}

export interface Pedido {
  id: number;
  idCliente: number | null;
  cliente: string;
  tipo: TipoPedido;
  /** Opcional en datos antiguos; se asume NORMAL. */
  clase?: ClasePedido;
  direccion: string | null;
  estado: EstadoPedido;
  lineas: LineaPedido[];
  total: number;
  creadoEn: string;
  observaciones?: string | null;
  /** Estado de pago que devuelve pagos-service cuando el pedido ya fue cobrado. */
  pagoEstado?: EstadoPago;
}

export interface NuevoPedido {
  idCliente: number;
  cliente: string;
  tipo: TipoPedido;
  clase?: ClasePedido;
  direccion: string | null;
  lineas: LineaPedido[];
  observaciones?: string | null;
}

export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export const ESTADOS_PEDIDO: EstadoPedido[] = [
  'RECIBIDO',
  'EN_PREPARACION',
  'EN_RUTA',
  'ENTREGADO',
  'CANCELADO',
];

const ESTADOS_FLUJO: EstadoPedido[] = ['RECIBIDO', 'EN_PREPARACION', 'EN_RUTA', 'ENTREGADO'];

export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  RECIBIDO: 'Recibido',
  EN_PREPARACION: 'En preparación',
  EN_RUTA: 'En ruta',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export const ETIQUETA_TIPO: Record<TipoPedido, string> = {
  LLEVAR: 'Para llevar',
  DOMICILIO: 'A domicilio',
};

/** Color de la etiqueta de estado (clases `.adm-tag--*` de styles.scss). */
export const CLASE_ESTADO: Record<EstadoPedido, string> = {
  RECIBIDO: 'adm-tag--chile',
  EN_PREPARACION: 'adm-tag--mustard',
  EN_RUTA: 'adm-tag--green',
  ENTREGADO: '',
  CANCELADO: 'adm-tag--chile',
};

export function esSuscripcion(pedido: Pick<Pedido, 'clase'>): boolean {
  return pedido.clase === 'SUSCRIPCION';
}

/** Texto del tipo de un pedido: la modalidad, o "Suscripción Club Alan". */
export function etiquetaTipoPedido(pedido: Pick<Pedido, 'tipo' | 'clase'>): string {
  return esSuscripcion(pedido) ? 'Suscripción Club Alan' : ETIQUETA_TIPO[pedido.tipo];
}

/**
 * Estados por los que pasa un pedido. "En ruta" solo aplica a domicilio: un pedido
 * para llevar pasa directo de "En preparación" a "Entregado". Una suscripcion no se
 * prepara ni se envia: pasa de "Recibido" a "Entregado" (membresia activada).
 */
export function flujoDe(pedido: Pick<Pedido, 'tipo' | 'clase' | 'estado'>): EstadoPedido[] {
  if (pedido.estado === 'CANCELADO') {
    return ['CANCELADO'];
  }
  if (esSuscripcion(pedido)) {
    return ['RECIBIDO', 'ENTREGADO'];
  }
  return pedido.tipo === 'DOMICILIO'
    ? ESTADOS_FLUJO
    : ESTADOS_FLUJO.filter((estado) => estado !== 'EN_RUTA');
}

export function siguienteEstado(pedido: Pick<Pedido, 'tipo' | 'clase' | 'estado'>): EstadoPedido | null {
  const flujo = flujoDe(pedido);
  return flujo[flujo.indexOf(pedido.estado) + 1] ?? null;
}

/** Texto del boton que avanza el pedido; vacio si ya esta entregado. */
export function accionDe(pedido: Pick<Pedido, 'tipo' | 'clase' | 'estado'>): string {
  if (pedido.estado === 'CANCELADO') {
    return '';
  }
  if (esSuscripcion(pedido)) {
    return pedido.estado === 'RECIBIDO' ? 'Activar membresía' : '';
  }
  switch (pedido.estado) {
    case 'RECIBIDO':
      return 'Preparar';
    case 'EN_PREPARACION':
      return pedido.tipo === 'DOMICILIO' ? 'Enviar' : 'Entregar';
    case 'EN_RUTA':
      return 'Entregar';
    default:
      return '';
  }
}

/** Texto corto con los articulos de un pedido, p. ej. "2 × 3 Tacos + Hamburguesa". */
export function resumenLineas(lineas: LineaPedido[]): string {
  return lineas.map((l) => (l.cantidad > 1 ? `${l.cantidad} × ${l.nombre}` : l.nombre)).join(' + ');
}
