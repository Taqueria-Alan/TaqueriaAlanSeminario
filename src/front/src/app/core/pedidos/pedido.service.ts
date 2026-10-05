import { Injectable, effect, inject, signal } from '@angular/core';
import { Observable, defer, delay, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { MENU_ESTATICO } from '../data/menu.data';
import {
  EstadoPedido,
  LineaPedido,
  NuevoPedido,
  Pedido,
  TipoPedido,
  esSuscripcion,
  siguienteEstado,
} from './pedido.model';

/**
 * PEDIDOS SIMULADOS.
 *
 * pedidos-service todavia no expone endpoints, asi que los pedidos viven en
 * localStorage y se comparten entre el panel de cliente y el de admin (misma
 * pestana o navegador). Cuando exista la API, reemplaza el cuerpo de `crear` y
 * `avanzar` por llamadas HttpClient y alimenta `pedidos` desde el backend.
 *
 * Para que el resumen y los reportes tengan datos, la primera vez se siembra
 * una semana de historial y, cada dia nuevo, los pedidos de ejemplo de hoy.
 */

const PEDIDOS_KEY = 'taqueria_mock_pedidos';
const LATENCIA_MS = 250;
const PRIMER_ID_HOY = 1040;
const DIAS_HISTORIAL = 6;

type SemillaPedido = [hora: string, cliente: string, tipo: TipoPedido, estado: EstadoPedido, items: [number, number][]];

const SEMILLAS_HOY: SemillaPedido[] = [
  ['19:05', 'Ana M.', 'LLEVAR', 'ENTREGADO', [[1001, 1], [1011, 1]]],
  ['19:20', 'Luis P.', 'DOMICILIO', 'ENTREGADO', [[1004, 1], [1033, 1]]],
  ['19:35', 'Marta G.', 'LLEVAR', 'ENTREGADO', [[1032, 1]]],
  ['19:50', 'Diego R.', 'DOMICILIO', 'ENTREGADO', [[1013, 1], [1012, 1]]],
  ['20:10', 'Sofía L.', 'LLEVAR', 'ENTREGADO', [[1023, 1]]],
  ['20:25', 'Pablo T.', 'DOMICILIO', 'ENTREGADO', [[1002, 1], [1033, 1]]],
  ['20:40', 'Rosa C.', 'LLEVAR', 'EN_PREPARACION', [[1021, 2]]],
  ['20:50', 'Jorge V.', 'DOMICILIO', 'EN_RUTA', [[1003, 1], [1011, 2]]],
  ['21:00', 'Elena B.', 'LLEVAR', 'EN_PREPARACION', [[1031, 1]]],
  ['21:10', 'Mario S.', 'LLEVAR', 'RECIBIDO', [[1001, 2]]],
  ['21:15', 'Lucía F.', 'DOMICILIO', 'RECIBIDO', [[1012, 1]]],
];

const NOMBRES_HISTORIAL = ['Ana M.', 'Luis P.', 'Marta G.', 'Diego R.', 'Sofía L.', 'Pablo T.', 'Rosa C.', 'Jorge V.', 'Elena B.', 'Mario S.'];

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly auth = inject(AuthService);
  private readonly _pedidos = signal<Pedido[]>(this.sembrar(this.leer()));

  readonly pedidos = this._pedidos.asReadonly();

  constructor() {
    effect(() => localStorage.setItem(PEDIDOS_KEY, JSON.stringify(this._pedidos())));
  }

  crear(nuevo: NuevoPedido): Observable<Pedido> {
    return defer(() => {
      const pedido: Pedido = {
        id: this.siguienteId(),
        idCliente: nuevo.idCliente,
        cliente: nuevo.cliente,
        tipo: nuevo.tipo,
        clase: nuevo.clase ?? 'NORMAL',
        direccion: nuevo.tipo === 'DOMICILIO' ? nuevo.direccion : null,
        estado: 'RECIBIDO',
        lineas: nuevo.lineas,
        total: totalDe(nuevo.lineas),
        creadoEn: new Date().toISOString(),
      };
      this._pedidos.update((lista) => [...lista, pedido]);
      return of(pedido);
    }).pipe(delay(LATENCIA_MS));
  }

  /** Pasa el pedido al siguiente estado de su flujo (ver `flujoDe`). */
  avanzar(id: number): Observable<Pedido | undefined> {
    return defer(() => {
      let actualizado: Pedido | undefined;
      this._pedidos.update((lista) =>
        lista.map((p) => {
          const siguiente = siguienteEstado(p);
          if (p.id !== id || !siguiente) {
            return p;
          }
          actualizado = { ...p, estado: siguiente };
          return actualizado;
        }),
      );
      this.completarSuscripcion(actualizado);
      return of(actualizado);
    });
  }

  /** Borra los pedidos simulados y vuelve a sembrar los datos de ejemplo. */
  restablecer(): void {
    this._pedidos.set(this.sembrar([]));
  }

  /**
   * Al entregar una suscripcion el cliente pasa a ser miembro. En el backend real esto lo
   * hace pedidos-service llamando a club-alan-service (POST /clientes/{id}/membresia).
   */
  private completarSuscripcion(pedido: Pedido | undefined): void {
    if (pedido && esSuscripcion(pedido) && pedido.estado === 'ENTREGADO' && pedido.idCliente !== null) {
      this.auth.activarMembresiaSimulada(pedido.idCliente);
    }
  }

  private siguienteId(): number {
    return Math.max(PRIMER_ID_HOY - 1, ...this._pedidos().map((p) => p.id)) + 1;
  }

  private leer(): Pedido[] {
    try {
      const leidos = JSON.parse(localStorage.getItem(PEDIDOS_KEY) ?? '[]');
      return Array.isArray(leidos) ? leidos.map((p) => migrarEstado({ ...p, clase: p.clase ?? 'NORMAL' })) : [];
    } catch {
      return [];
    }
  }

  private sembrar(guardados: Pedido[]): Pedido[] {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    const sinHistorial = !guardados.some((p) => new Date(p.creadoEn) < inicioHoy);
    const lista = sinHistorial ? [...generarHistorial(), ...guardados] : guardados;
    const hoy = new Date().toDateString();
    if (lista.some((p) => new Date(p.creadoEn).toDateString() === hoy)) {
      return lista;
    }
    const base = Math.max(PRIMER_ID_HOY - 1, ...lista.map((p) => p.id));
    return [...lista, ...SEMILLAS_HOY.map((s, i) => crearSemilla(s, base + i + 1))];
  }
}

/** Convierte los estados de una version anterior de los datos simulados a los vigentes. */
function migrarEstado(p: Pedido): Pedido {
  const anterior = p.estado as string;
  if (anterior === 'NUEVO') {
    return { ...p, estado: 'RECIBIDO' };
  }
  if (anterior === 'PREPARANDO') {
    return { ...p, estado: 'EN_PREPARACION' };
  }
  if (anterior === 'LISTO') {
    return { ...p, estado: p.tipo === 'DOMICILIO' ? 'EN_RUTA' : 'EN_PREPARACION' };
  }
  return p;
}

export function totalDe(lineas: LineaPedido[]): number {
  return lineas.reduce((suma, l) => suma + l.precio * l.cantidad, 0);
}

function lineasDe(items: [number, number][]): LineaPedido[] {
  const catalogo = MENU_ESTATICO.flatMap((c) => c.items);
  return items.map(([idProducto, cantidad]) => {
    const item = catalogo.find((i) => i.id === idProducto)!;
    return { idProducto, nombre: item.nombre, detalle: item.detalle, precio: item.precio, cantidad };
  });
}

function crearSemilla([hora, cliente, tipo, estado, items]: SemillaPedido, id: number): Pedido {
  const lineas = lineasDe(items);
  const [h, m] = hora.split(':').map(Number);
  const fecha = new Date();
  fecha.setHours(h, m, 0, 0);
  return { id, idCliente: null, cliente, tipo, clase: 'NORMAL', direccion: null, estado, lineas, total: totalDe(lineas), creadoEn: fecha.toISOString() };
}

/** Pedidos entregados de los ultimos dias, con un generador pseudoaleatorio fijo. */
function generarHistorial(): Pedido[] {
  let semilla = 7;
  const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
  const ids = MENU_ESTATICO.flatMap((c) => c.items.map((i) => i.id));
  const pedidos: Pedido[] = [];
  let id = 900;

  for (let dia = DIAS_HISTORIAL; dia >= 1; dia--) {
    const cantidad = 8 + Math.floor(azar() * 8);
    for (let n = 0; n < cantidad; n++) {
      const items: [number, number][] = Array.from({ length: 1 + Math.floor(azar() * 3) }, () => [
        ids[Math.floor(azar() * ids.length)],
        1 + Math.floor(azar() * 2),
      ]);
      const lineas = lineasDe(items);
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - dia);
      fecha.setHours(19 + Math.floor(azar() * 3), Math.floor(azar() * 60), 0, 0);
      pedidos.push({
        id: id++,
        idCliente: null,
        cliente: NOMBRES_HISTORIAL[Math.floor(azar() * NOMBRES_HISTORIAL.length)],
        tipo: azar() > 0.6 ? 'DOMICILIO' : 'LLEVAR',
        clase: 'NORMAL',
        direccion: null,
        estado: 'ENTREGADO',
        lineas,
        total: totalDe(lineas),
        creadoEn: fecha.toISOString(),
      });
    }
  }
  return pedidos;
}
