import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, ViewChild, computed, inject, signal } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs';
import { ClienteSearchComponent } from '../cliente-search/cliente-search';
import { ClienteBusqueda } from '../models/cliente.model';
import { MovimientoPuntos, TipoMovimiento } from '../models/movimiento.model';
import { ClubAlanService } from '../services/club-alan.service';

type FiltroTipo = 'TODOS' | TipoMovimiento;

@Component({
  selector: 'app-movimientos-list',
  standalone: true,
  imports: [DatePipe, MatPaginatorModule, ClienteSearchComponent],
  templateUrl: './movimientos-list.html',
  styleUrl: './movimientos-list.scss',
})
export class MovimientosListComponent implements AfterViewInit {
  private readonly clubAlanService = inject(ClubAlanService);

  @ViewChild(ClienteSearchComponent) private buscador?: ClienteSearchComponent;

  readonly cargando = signal(false);
  readonly buscado = signal(false);
  readonly cliente = signal<ClienteBusqueda | null>(null);
  readonly movimientos = signal<MovimientoPuntos[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly filtro = signal<FiltroTipo>('TODOS');

  readonly filtros: { valor: FiltroTipo; etiqueta: string }[] = [
    { valor: 'TODOS', etiqueta: 'Todos' },
    { valor: 'ACUMULACION', etiqueta: 'Acumulaciones' },
    { valor: 'CANJE', etiqueta: 'Canjes' },
  ];

  /** Movimientos de la pagina actual segun el filtro de tipo. */
  readonly visibles = computed(() => {
    const filtro = this.filtro();
    return this.movimientos().filter((m) => filtro === 'TODOS' || m.tipo === filtro);
  });

  readonly acumulado = computed(() => this.suma((m) => m.puntos > 0));
  readonly canjeado = computed(() => Math.abs(this.suma((m) => m.puntos < 0)));
  /** El historial llega del mas reciente al mas antiguo: el primero trae el saldo vigente. */
  readonly saldo = computed(() => this.movimientos()[0]?.saldoActual ?? null);

  ngAfterViewInit(): void {
    const previo = history.state?.['cliente'] as ClienteBusqueda | undefined;
    if (previo) {
      this.buscador?.establecer(previo);
      this.onClienteSeleccionado(previo);
    }
  }

  onClienteSeleccionado(cliente: ClienteBusqueda): void {
    this.cliente.set(cliente);
    this.pageIndex.set(0);
    this.filtro.set('TODOS');
    this.buscado.set(true);
    this.cargar();
  }

  cambiarPagina(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargar();
  }

  private suma(condicion: (m: MovimientoPuntos) => boolean): number {
    return this.movimientos()
      .filter(condicion)
      .reduce((total, m) => total + m.puntos, 0);
  }

  private cargar(): void {
    const cliente = this.cliente();
    if (!cliente) {
      return;
    }
    this.cargando.set(true);
    this.clubAlanService
      .listarMovimientos(cliente.idCliente, this.pageIndex(), this.pageSize())
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe((pagina) => {
        this.movimientos.set(pagina.content);
        this.totalElements.set(pagina.totalElements);
      });
  }
}
