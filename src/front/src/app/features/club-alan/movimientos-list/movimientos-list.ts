import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ClienteSearchComponent } from '../cliente-search/cliente-search';
import { ClienteBusqueda } from '../models/cliente.model';
import { MovimientoPuntos } from '../models/movimiento.model';
import { ClubAlanService } from '../services/club-alan.service';

@Component({
  selector: 'app-movimientos-list',
  standalone: true,
  imports: [
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    LoadingSpinner,
    EmptyState,
    ClienteSearchComponent,
  ],
  templateUrl: './movimientos-list.html',
  styleUrl: './movimientos-list.scss',
})
export class MovimientosListComponent {
  loading = false;
  buscado = false;
  clienteSeleccionado: ClienteBusqueda | null = null;
  movimientos: MovimientoPuntos[] = [];
  totalElements = 0;
  pageIndex = 0;
  pageSize = 10;

  readonly columnas = ['tipo', 'puntos', 'fecha', 'descripcion'];

  constructor(
    private readonly clubAlanService: ClubAlanService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  onClienteSeleccionado(cliente: ClienteBusqueda): void {
    this.clienteSeleccionado = cliente;
    this.pageIndex = 0;
    this.buscado = true;
    this.cargar();
  }

  cambiarPagina(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargar();
  }

  private cargar(): void {
    if (!this.clienteSeleccionado) {
      return;
    }

    this.loading = true;
    this.clubAlanService
      .listarMovimientos(this.clienteSeleccionado.idCliente, this.pageIndex, this.pageSize)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe((pagina) => {
        this.movimientos = pagina.content;
        this.totalElements = pagina.totalElements;
        this.cdr.markForCheck();
      });
  }
}
