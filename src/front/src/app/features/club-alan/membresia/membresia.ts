import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ClienteSearchComponent } from '../cliente-search/cliente-search';
import { ClienteBusqueda } from '../models/cliente.model';
import { ClienteMembresia, Membresia } from '../models/membresia.model';
import { ClubAlanService } from '../services/club-alan.service';

type FiltroEstado = 'ACTIVA' | 'INACTIVA' | 'TODAS';

@Component({
  selector: 'app-membresia',
  standalone: true,
  imports: [DatePipe, ClienteSearchComponent, MatPaginatorModule],
  templateUrl: './membresia.html',
  styleUrl: './membresia.scss',
})
export class MembresiaComponent implements OnInit, AfterViewInit {
  private readonly clubAlanService = inject(ClubAlanService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  @ViewChild(ClienteSearchComponent) private buscador?: ClienteSearchComponent;

  readonly cargando = signal(false);
  readonly procesando = signal(false);
  readonly buscado = signal(false);
  readonly cliente = signal<ClienteBusqueda | null>(null);
  readonly membresia = signal<Membresia | null>(null);
  /** Mensaje cuando la consulta fallo por algo distinto a "nunca tuvo membresia". */
  readonly errorConsulta = signal<string | null>(null);

  readonly miembros = signal<ClienteMembresia[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly filtroEstado = signal<FiltroEstado>('ACTIVA');
  readonly cargandoLista = signal(false);

  readonly filtros: { valor: FiltroEstado; etiqueta: string }[] = [
    { valor: 'ACTIVA', etiqueta: 'Activas' },
    { valor: 'INACTIVA', etiqueta: 'Inactivas' },
    { valor: 'TODAS', etiqueta: 'Todas' },
  ];

  readonly beneficios = [
    'Acumula puntos en cada pedido',
    'Canjea tus puntos como pago',
    'Envío gratis mientras la membresía esté activa',
  ];

  ngOnInit(): void {
    this.cargarMiembros();
  }

  ngAfterViewInit(): void {
    const previo = history.state?.['cliente'] as ClienteBusqueda | undefined;
    if (previo) {
      this.buscador?.establecer(previo);
      this.onClienteSeleccionado(previo);
    }
  }

  cambiarEstado(estado: FiltroEstado): void {
    this.filtroEstado.set(estado);
    this.pageIndex.set(0);
    this.cargarMiembros();
  }

  cambiarPagina(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarMiembros();
  }

  seleccionarDeLista(miembro: ClienteMembresia): void {
    const cliente: ClienteBusqueda = {
      idCliente: miembro.idCliente,
      nombre: miembro.nombre,
      telefono: miembro.telefono,
      puntos: 0,
      miembroClub: miembro.activa,
    };
    this.buscador?.establecer(cliente);
    this.onClienteSeleccionado(cliente);
  }

  onClienteSeleccionado(cliente: ClienteBusqueda): void {
    this.cliente.set(cliente);
    this.consultar();
  }

  activar(): void {
    const cliente = this.cliente();
    if (!cliente) {
      return;
    }
    this.procesando.set(true);
    this.clubAlanService
      .activarMembresia(cliente.idCliente)
      .pipe(finalize(() => this.procesando.set(false)))
      .subscribe((membresia) => {
        this.membresia.set(membresia);
        this.errorConsulta.set(null);
        this.notificationService.success('Membresía activada correctamente');
        this.cargarMiembros();
      });
  }

  cancelar(): void {
    const cliente = this.cliente();
    if (!cliente) {
      return;
    }
    const data: ConfirmDialogData = {
      title: 'Cancelar membresía',
      message: `¿Seguro que deseas cancelar la membresía Club Alan de ${cliente.nombre}?`,
      confirmText: 'Cancelar membresía',
    };
    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmado) => {
        if (!confirmado) {
          return;
        }
        this.procesando.set(true);
        this.clubAlanService
          .cancelarMembresia(cliente.idCliente)
          .pipe(finalize(() => this.procesando.set(false)))
          .subscribe(() => {
            this.notificationService.success('Membresía cancelada');
            this.consultar();
            this.cargarMiembros();
          });
      });
  }

  private cargarMiembros(): void {
    this.cargandoLista.set(true);
    this.clubAlanService
      .listarMiembros(this.filtroEstado(), this.pageIndex(), this.pageSize())
      .pipe(finalize(() => this.cargandoLista.set(false)))
      .subscribe((pagina) => {
        this.miembros.set(pagina.content);
        this.totalElements.set(pagina.totalElements);
      });
  }

  private consultar(): void {
    const cliente = this.cliente();
    if (!cliente) {
      return;
    }
    this.cargando.set(true);
    this.buscado.set(true);
    this.membresia.set(null);
    this.errorConsulta.set(null);

    this.clubAlanService
      .obtenerMembresia(cliente.idCliente, true)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (membresia) => this.membresia.set(membresia),
        error: (error: HttpErrorResponse) =>
          this.errorConsulta.set(error.status === 404 ? null : 'No se pudo consultar la membresía. Intenta de nuevo.'),
      });
  }
}
