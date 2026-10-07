import { Component, computed, inject } from '@angular/core';
import {
  EstadoPedido,
  Pedido,
  accionDe,
  etiquetaTipoPedido,
  resumenLineas,
} from '../../core/pedidos/pedido.model';
import { PedidoService } from '../../core/pedidos/pedido.service';

interface ColumnaPedidos {
  estado: EstadoPedido;
  titulo: string;
  pedidos: Pedido[];
}

const COLUMNAS: { estado: EstadoPedido; titulo: string }[] = [
  { estado: 'RECIBIDO', titulo: 'Recibidos' },
  { estado: 'EN_PREPARACION', titulo: 'En preparación' },
  { estado: 'EN_RUTA', titulo: 'En ruta' },
];

const ALTO_MAXIMO_BARRA = 170;

@Component({
  selector: 'app-admin-resumen',
  standalone: true,
  templateUrl: './admin-resumen.html',
  styleUrl: './admin-resumen.scss',
})
export class AdminResumenComponent {
  private readonly pedidoService = inject(PedidoService);

  readonly fecha = new Intl.DateTimeFormat('es-GT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  readonly tipoDe = etiquetaTipoPedido;
  readonly resumen = resumenLineas;
  readonly accionDe = accionDe;

  private readonly pedidosHoy = computed(() => {
    const hoy = new Date().toDateString();
    return this.pedidoService.pedidos().filter((p) => new Date(p.creadoEn).toDateString() === hoy);
  });

  readonly ventas = computed(() => this.pedidosHoy().reduce((s, p) => s + p.total, 0));
  readonly cantidad = computed(() => this.pedidosHoy().length);
  readonly ticket = computed(() => (this.cantidad() ? this.ventas() / this.cantidad() : 0));
  readonly enCurso = computed(() => this.pedidosHoy().filter((p) => p.estado !== 'ENTREGADO').length);

  /** Ventas (Q) por hora del dia; la barra mas alta se marca como hora pico. */
  readonly barras = computed(() => {
    const porHora = new Map<number, number>();
    for (const p of this.pedidosHoy()) {
      const hora = new Date(p.creadoEn).getHours();
      porHora.set(hora, (porHora.get(hora) ?? 0) + p.total);
    }
    const horas = [...porHora.keys()];
    const desde = Math.min(18, ...horas);
    const hasta = Math.max(22, ...horas);
    const maximo = Math.max(1, ...porHora.values());
    return Array.from({ length: hasta - desde + 1 }, (_, i) => {
      const hora = desde + i;
      const valor = porHora.get(hora) ?? 0;
      return {
        etiqueta: `${hora} h`,
        valor,
        alto: Math.round((valor / maximo) * ALTO_MAXIMO_BARRA),
        pico: valor > 0 && valor === maximo,
      };
    });
  });

  readonly masVendidos = computed(() => {
    const acumulado = new Map<number, { nombre: string; detalle: string; unidades: number }>();
    for (const p of this.pedidosHoy()) {
      for (const l of p.lineas) {
        const actual = acumulado.get(l.idProducto) ?? { nombre: l.nombre, detalle: l.detalle, unidades: 0 };
        actual.unidades += l.cantidad;
        acumulado.set(l.idProducto, actual);
      }
    }
    const top = [...acumulado.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 5);
    const maximo = Math.max(1, ...top.map((t) => t.unidades));
    return top.map((t) => ({ ...t, ancho: Math.round((t.unidades / maximo) * 100) }));
  });

  readonly columnas = computed<ColumnaPedidos[]>(() =>
    COLUMNAS.map((c) => ({
      ...c,
      pedidos: this.pedidosHoy()
        .filter((p) => p.estado === c.estado)
        .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn)),
    })),
  );

  avanzar(id: number): void {
    this.pedidoService.avanzar(id).subscribe();
  }

  hora(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  }
}
