import { Component, computed, inject, signal } from '@angular/core';
import {
  CLASE_ESTADO,
  ESTADOS_PEDIDO,
  ETIQUETA_ESTADO,
  EstadoPedido,
  Pedido,
  accionDe,
  etiquetaTipoPedido,
  flujoDe,
  resumenLineas,
} from '../../core/pedidos/pedido.model';
import { PedidoService } from '../../core/pedidos/pedido.service';

type FiltroEstado = 'TODOS' | EstadoPedido;
type Periodo = 'hoy' | '7d' | 'todo';

const ETIQUETA_FILTRO: Record<EstadoPedido, string> = {
  RECIBIDO: 'Recibidos',
  EN_PREPARACION: 'En preparación',
  EN_RUTA: 'En ruta',
  ENTREGADO: 'Entregados',
  CANCELADO: 'Cancelados',
};

@Component({
  selector: 'app-admin-pedidos',
  standalone: true,
  templateUrl: './admin-pedidos.html',
  styleUrl: './admin-pedidos.scss',
})
export class AdminPedidosComponent {
  private readonly pedidoService = inject(PedidoService);

  readonly etiquetaEstado = ETIQUETA_ESTADO;
  readonly tipoDe = etiquetaTipoPedido;
  readonly accionDe = accionDe;
  readonly claseEstado = CLASE_ESTADO;
  readonly resumen = resumenLineas;

  readonly periodos: { valor: Periodo; etiqueta: string }[] = [
    { valor: 'hoy', etiqueta: 'Hoy' },
    { valor: '7d', etiqueta: '7 días' },
    { valor: 'todo', etiqueta: 'Todo' },
  ];

  readonly estado = signal<FiltroEstado>('TODOS');
  readonly periodo = signal<Periodo>('hoy');
  readonly busqueda = signal('');
  readonly seleccionadoId = signal<number | null>(null);

  /** Pedidos del periodo y la busqueda elegidos, sin filtrar por estado. */
  private readonly base = computed(() => {
    const desde = this.desdeDelPeriodo();
    const texto = this.busqueda().trim().toLowerCase();
    return this.pedidoService
      .pedidos()
      .filter((p) => new Date(p.creadoEn) >= desde)
      .filter(
        (p) => !texto || p.cliente.toLowerCase().includes(texto) || String(p.id).includes(texto.replace('#', '')),
      );
  });

  readonly filtrosEstado = computed(() => {
    const base = this.base();
    return [
      { valor: 'TODOS' as FiltroEstado, etiqueta: 'Todos', cantidad: base.length },
      ...ESTADOS_PEDIDO.map((e) => ({
        valor: e as FiltroEstado,
        etiqueta: ETIQUETA_FILTRO[e],
        cantidad: base.filter((p) => p.estado === e).length,
      })),
    ];
  });

  readonly lista = computed(() => {
    const estado = this.estado();
    return this.base()
      .filter((p) => estado === 'TODOS' || p.estado === estado)
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
  });

  readonly seleccionado = computed(() => {
    const id = this.seleccionadoId();
    return id === null ? null : (this.pedidoService.pedidos().find((p) => p.id === id) ?? null);
  });

  /** Etapas del pedido seleccionado para la linea de tiempo. */
  readonly etapas = computed(() => {
    const pedido = this.seleccionado();
    if (!pedido) {
      return [];
    }
    const flujo = flujoDe(pedido);
    const actual = flujo.indexOf(pedido.estado);
    return flujo.map((e, i) => ({
      etiqueta: ETIQUETA_ESTADO[e],
      situacion: i < actual || (i === actual && e === 'ENTREGADO') ? 'done' : i === actual ? 'active' : 'pending',
    }));
  });

  avanzar(pedido: Pedido, evento?: Event): void {
    evento?.stopPropagation();
    this.pedidoService.avanzar(pedido.id).subscribe({ error: () => undefined });
  }

  alternar(id: number): void {
    this.seleccionadoId.update((actual) => (actual === id ? null : id));
  }

  buscar(texto: string): void {
    this.busqueda.set(texto);
  }

  fecha(iso: string): string {
    const f = new Date(iso);
    const hora = f.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
    return f.toDateString() === new Date().toDateString()
      ? hora
      : `${f.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}, ${hora}`;
  }

  private desdeDelPeriodo(): Date {
    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    switch (this.periodo()) {
      case 'hoy':
        return desde;
      case '7d':
        desde.setDate(desde.getDate() - 6);
        return desde;
      default:
        return new Date(0);
    }
  }
}
