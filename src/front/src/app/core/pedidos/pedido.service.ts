import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { OMITIR_NOTIFICACION_ERROR } from '../interceptors/error.interceptor';
import { EstadoPago, EstadoPedido, LineaPedido, NuevoPedido, Pedido } from './pedido.model';

interface PedidoApi {
  id?: number;
  idPedido?: number;
  idCliente?: number | null;
  cliente?: string;
  nombreCliente?: string;
  tipo?: string;
  modalidad?: string;
  clase?: string;
  estado?: string;
  direccion?: string | null;
  direccionEntrega?: string | null;
  lineas?: LineaApi[];
  detalles?: LineaApi[];
  total?: number | string;
  creadoEn?: string;
  fechaHora?: string;
  observaciones?: string | null;
  pagoEstado?: string;
}

interface LineaApi {
  idProducto?: number;
  productoId?: number;
  nombre?: string;
  nombreProducto?: string;
  detalle?: string;
  descripcion?: string;
  precio?: number | string;
  precioUnitario?: number | string;
  cantidad?: number;
  observaciones?: string | null;
}

/**
 * Cliente HTTP de pedidos-service. No conserva pedidos, precios ni semillas en
 * el navegador: el backend calcula el total y mantiene el historial oficial.
 */
@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly _pedidos = signal<Pedido[]>([]);

  readonly pedidos = this._pedidos.asReadonly();
  /** Identidad usada por el puente local hasta que auth-service entregue JWT. */
  readonly clienteActualId = computed<number | null>(() =>
    environment.securityEnabled ? (this.auth.usuario()?.id ?? null) : environment.clienteDemoId,
  );

  constructor() {
    this.cargar().subscribe({ error: () => undefined });
  }

  /** Refresca el listado que comparten el panel del cliente y el de administración. */
  cargar(): Observable<Pedido[]> {
    const context = new HttpContext().set(OMITIR_NOTIFICACION_ERROR, true);
    return this.http.get<PedidoApi[]>(environment.pedidosApiUrl, { context }).pipe(
      map((respuesta) => respuesta.map(normalizarPedido)),
      tap((pedidos) => this._pedidos.set(pedidos)),
    );
  }

  obtener(id: number, silencioso = false): Observable<Pedido> {
    const context = new HttpContext().set(OMITIR_NOTIFICACION_ERROR, silencioso);
    return this.http.get<PedidoApi>(`${environment.pedidosApiUrl}/${id}`, { context }).pipe(
      map(normalizarPedido),
      tap((pedido) => this.guardar(pedido)),
    );
  }

  crear(nuevo: NuevoPedido): Observable<Pedido> {
    const idCliente = this.clienteActualId() ?? nuevo.idCliente;
    if (idCliente === null) {
      return throwError(() => new Error('No hay un cliente autenticado para crear el pedido.'));
    }
    return this.http
      .post<PedidoApi>(environment.pedidosApiUrl, aSolicitud(nuevo, idCliente))
      .pipe(map(normalizarPedido), tap((pedido) => this.guardar(pedido)));
  }

  /** Editar solo se habilita en la interfaz mientras el pedido está recibido y sin pago. */
  actualizar(id: number, nuevo: NuevoPedido): Observable<Pedido> {
    const idCliente = this.clienteActualId() ?? nuevo.idCliente;
    if (idCliente === null) {
      return throwError(() => new Error('No hay un cliente autenticado para actualizar el pedido.'));
    }
    return this.http
      .put<PedidoApi>(`${environment.pedidosApiUrl}/${id}`, aSolicitud(nuevo, idCliente))
      .pipe(map(normalizarPedido), tap((pedido) => this.guardar(pedido)));
  }

  cancelar(id: number): Observable<Pedido> {
    return this.http
      .post<PedidoApi>(`${environment.pedidosApiUrl}/${id}/cancelar`, {})
      .pipe(map(normalizarPedido), tap((pedido) => this.guardar(pedido)));
  }

  /** Pasa el pedido al siguiente estado permitido por pedidos-service. */
  avanzar(id: number): Observable<Pedido> {
    return this.http
      .post<PedidoApi>(`${environment.pedidosApiUrl}/${id}/avanzar`, {})
      .pipe(map(normalizarPedido), tap((pedido) => this.guardar(pedido)));
  }

  /** Obtiene de nuevo los pedidos desde la fuente de verdad, sin datos locales simulados. */
  recargar(): Observable<Pedido[]> {
    return this.cargar().pipe(
      catchError((error) => {
        this._pedidos.set([]);
        return throwError(() => error);
      }),
    );
  }

  private guardar(pedido: Pedido): void {
    this._pedidos.update((actuales) => {
      const indice = actuales.findIndex((actual) => actual.id === pedido.id);
      if (indice < 0) {
        return [pedido, ...actuales];
      }
      return actuales.map((actual) => (actual.id === pedido.id ? pedido : actual));
    });
  }
}

function aSolicitud(nuevo: NuevoPedido, idCliente: number) {
  return {
    idCliente,
    tipo: nuevo.tipo,
    clase: nuevo.clase ?? 'NORMAL',
    direccion: nuevo.tipo === 'DOMICILIO' ? nuevo.direccion?.trim() || null : null,
    observaciones: nuevo.observaciones?.trim() || null,
    // Nunca se envían precio ni total: pedidos-service consulta el catálogo oficial.
    lineas: nuevo.lineas.map((linea) => ({
      idProducto: linea.idProducto,
      cantidad: linea.cantidad,
      observaciones: linea.observaciones?.trim() || null,
    })),
  };
}

function normalizarPedido(api: PedidoApi): Pedido {
  const tipo = api.tipo ?? api.modalidad ?? 'LLEVAR';
  const estado = api.estado ?? 'RECIBIDO';
  const lineas = api.lineas ?? api.detalles ?? [];
  const idCliente = api.idCliente === null || api.idCliente === undefined ? null : numero(api.idCliente);
  return {
    id: numero(api.id ?? api.idPedido),
    idCliente,
    cliente: api.cliente ?? api.nombreCliente ?? (idCliente === null ? 'Cliente' : `Cliente #${idCliente}`),
    tipo: tipo === 'DOMICILIO' ? 'DOMICILIO' : 'LLEVAR',
    clase: api.clase === 'SUSCRIPCION' ? 'SUSCRIPCION' : 'NORMAL',
    direccion: api.direccion ?? api.direccionEntrega ?? null,
    estado: estadoValido(estado),
    lineas: lineas.map(normalizarLinea),
    total: numero(api.total),
    creadoEn: api.creadoEn ?? api.fechaHora ?? new Date().toISOString(),
    observaciones: api.observaciones ?? null,
    pagoEstado: estadoPagoValido(api.pagoEstado),
  };
}

function normalizarLinea(api: LineaApi): LineaPedido {
  return {
    idProducto: numero(api.idProducto ?? api.productoId),
    nombre: api.nombre ?? api.nombreProducto ?? 'Producto',
    detalle: api.detalle ?? api.descripcion ?? '',
    precio: numero(api.precio ?? api.precioUnitario),
    cantidad: numero(api.cantidad),
    observaciones: api.observaciones ?? null,
  };
}

function numero(valor: number | string | undefined | null): number {
  const convertido = Number(valor ?? 0);
  return Number.isFinite(convertido) ? convertido : 0;
}

function estadoValido(valor: string): EstadoPedido {
  const estado = valor.toUpperCase().replace(/\s+/g, '_');
  return ['RECIBIDO', 'EN_PREPARACION', 'EN_RUTA', 'ENTREGADO', 'CANCELADO'].includes(estado)
    ? (estado as EstadoPedido)
    : 'RECIBIDO';
}

function estadoPagoValido(valor: string | undefined): EstadoPago | undefined {
  return valor === 'APROBADO' || valor === 'RECHAZADO' || valor === 'PENDIENTE' ? valor : undefined;
}
