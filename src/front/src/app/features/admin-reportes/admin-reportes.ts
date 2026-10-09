import { Component, computed, inject, signal } from '@angular/core';
import {
  ETIQUETA_ESTADO,
  ETIQUETA_TIPO,
  esSuscripcion,
  etiquetaTipoPedido,
  resumenLineas,
} from '../../core/pedidos/pedido.model';
import { PedidoService } from '../../core/pedidos/pedido.service';

type Periodo = 'hoy' | '7d' | '30d' | 'todo';

const ALTO_MAXIMO_BARRA = 170;
const MS_DIA = 86_400_000;

@Component({
  selector: 'app-admin-reportes',
  standalone: true,
  templateUrl: './admin-reportes.html',
  styleUrl: './admin-reportes.scss',
})
export class AdminReportesComponent {
  private readonly pedidoService = inject(PedidoService);

  readonly periodos: { valor: Periodo; etiqueta: string }[] = [
    { valor: 'hoy', etiqueta: 'Hoy' },
    { valor: '7d', etiqueta: '7 días' },
    { valor: '30d', etiqueta: '30 días' },
    { valor: 'todo', etiqueta: 'Todo' },
  ];

  readonly periodo = signal<Periodo>('7d');

  private readonly desde = computed(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    switch (this.periodo()) {
      case 'hoy':
        return d;
      case '7d':
        d.setDate(d.getDate() - 6);
        return d;
      case '30d':
        d.setDate(d.getDate() - 29);
        return d;
      default: {
        const primero = Math.min(...this.pedidoService.pedidos().map((p) => new Date(p.creadoEn).getTime()));
        const inicio = new Date(Number.isFinite(primero) ? primero : Date.now());
        inicio.setHours(0, 0, 0, 0);
        return inicio;
      }
    }
  });

  readonly pedidos = computed(() => {
    const desde = this.desde();
    return this.pedidoService.pedidos().filter((p) => new Date(p.creadoEn) >= desde);
  });

  readonly ventas = computed(() => this.pedidos().reduce((s, p) => s + p.total, 0));
  readonly cantidad = computed(() => this.pedidos().length);
  readonly ticket = computed(() => (this.cantidad() ? this.ventas() / this.cantidad() : 0));
  readonly unidades = computed(() => this.pedidos().reduce((s, p) => s + p.lineas.reduce((n, l) => n + l.cantidad, 0), 0));

  readonly titulosGrafica = computed(() => (this.periodo() === 'hoy' ? 'Ventas por hora' : 'Ventas por día'));

  /** Barras de la grafica: horas si el periodo es hoy, dias en cualquier otro caso. */
  readonly barras = computed(() => {
    const porClave = new Map<string, number>();
    const etiquetas: { clave: string; etiqueta: string }[] = [];

    if (this.periodo() === 'hoy') {
      const horas = this.pedidos().map((p) => new Date(p.creadoEn).getHours());
      const desde = Math.min(18, ...horas);
      const hasta = Math.max(22, ...horas);
      for (let h = desde; h <= hasta; h++) {
        etiquetas.push({ clave: String(h), etiqueta: `${h} h` });
      }
      for (const p of this.pedidos()) {
        const clave = String(new Date(p.creadoEn).getHours());
        porClave.set(clave, (porClave.get(clave) ?? 0) + p.total);
      }
    } else {
      const dias = Math.floor((Date.now() - this.desde().getTime()) / MS_DIA) + 1;
      for (let i = 0; i < dias; i++) {
        const d = new Date(this.desde().getTime() + i * MS_DIA);
        etiquetas.push({
          clave: d.toDateString(),
          etiqueta: d.toLocaleDateString('es-GT', { day: 'numeric', month: 'numeric' }),
        });
      }
      for (const p of this.pedidos()) {
        const clave = new Date(p.creadoEn).toDateString();
        porClave.set(clave, (porClave.get(clave) ?? 0) + p.total);
      }
    }

    const maximo = Math.max(1, ...porClave.values());
    return etiquetas.map(({ clave, etiqueta }) => {
      const valor = porClave.get(clave) ?? 0;
      return {
        etiqueta,
        valor,
        alto: Math.round((valor / maximo) * ALTO_MAXIMO_BARRA),
        pico: valor > 0 && valor === maximo,
      };
    });
  });

  /** Ventas por modalidad de los pedidos normales, mas las suscripciones al Club Alan aparte. */
  readonly porTipo = computed(() => {
    const total = Math.max(1, this.ventas());
    const fila = (etiqueta: string, pedidos: { total: number }[]) => {
      const ventas = pedidos.reduce((s, p) => s + p.total, 0);
      return { etiqueta, pedidos: pedidos.length, ventas, ancho: Math.round((ventas / total) * 100) };
    };
    const normales = this.pedidos().filter((p) => !esSuscripcion(p));
    return [
      fila(ETIQUETA_TIPO.LLEVAR, normales.filter((p) => p.tipo === 'LLEVAR')),
      fila(ETIQUETA_TIPO.DOMICILIO, normales.filter((p) => p.tipo === 'DOMICILIO')),
      fila('Suscripciones Club Alan', this.pedidos().filter(esSuscripcion)),
    ];
  });

  readonly productos = computed(() => {
    const acumulado = new Map<number, { nombre: string; detalle: string; unidades: number; ingresos: number }>();
    for (const p of this.pedidos()) {
      for (const l of p.lineas) {
        const actual = acumulado.get(l.idProducto) ?? { nombre: l.nombre, detalle: l.detalle, unidades: 0, ingresos: 0 };
        actual.unidades += l.cantidad;
        actual.ingresos += l.cantidad * l.precio;
        acumulado.set(l.idProducto, actual);
      }
    }
    return [...acumulado.values()].sort((a, b) => b.ingresos - a.ingresos).slice(0, 8);
  });

  /** Descarga los pedidos del periodo como CSV (se genera en el navegador). */
  exportarCsv(): void {
    const filas = [
      ['Pedido', 'Fecha', 'Cliente', 'Tipo', 'Estado', 'Articulos', 'Total (Q)'],
      ...[...this.pedidos()]
        .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn))
        .map((p) => [
          p.id,
          new Date(p.creadoEn).toLocaleString('es-GT'),
          p.cliente,
          etiquetaTipoPedido(p),
          ETIQUETA_ESTADO[p.estado],
          resumenLineas(p.lineas),
          p.total,
        ]),
    ];
    const csv = filas.map((f) => f.map(celda).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `pedidos-${this.periodo()}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  }
}

function celda(valor: string | number): string {
  return `"${String(valor).replace(/"/g, '""')}"`;
}
