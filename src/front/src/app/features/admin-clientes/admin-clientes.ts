import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, finalize, forkJoin, of } from 'rxjs';
import { ClienteBusqueda, ClienteListado, PuntosResponse } from '../club-alan/models/cliente.model';
import { Membresia } from '../club-alan/models/membresia.model';
import { MovimientoPuntos } from '../club-alan/models/movimiento.model';
import { ClubAlanService } from '../club-alan/services/club-alan.service';

interface Ficha {
  puntos: PuntosResponse | null;
  membresia: Membresia | null;
  movimientos: MovimientoPuntos[];
}

/**
 * Ficha de cliente: junta en una sola vista los datos que club-alan-service
 * expone por separado (puntos, membresia y ultimos movimientos).
 */
@Component({
  selector: 'app-admin-clientes',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, MatPaginatorModule],
  templateUrl: './admin-clientes.html',
  styleUrl: './admin-clientes.scss',
})
export class AdminClientesComponent implements OnInit {
  private readonly clubAlanService = inject(ClubAlanService);
  private readonly router = inject(Router);

  readonly busqueda = new FormControl('');

  readonly clientes = signal<ClienteListado[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly cargandoLista = signal(false);

  readonly cliente = signal<ClienteBusqueda | null>(null);
  readonly ficha = signal<Ficha | null>(null);
  readonly cargando = signal(false);

  readonly iniciales = computed(() =>
    (this.cliente()?.nombre ?? '')
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0))
      .join('')
      .toUpperCase(),
  );

  ngOnInit(): void {
    this.cargarLista();
    this.busqueda.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex.set(0);
      this.cargarLista();
    });
  }

  cambiarPagina(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarLista();
  }

  seleccionar(cliente: ClienteListado): void {
    this.cliente.set({
      idCliente: cliente.idCliente,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      puntos: cliente.puntosClubAlan,
      miembroClub: cliente.miembroClub,
    });
    this.ficha.set(null);
    this.cargando.set(true);

    // Cada consulta falla por separado: un cliente sin membresia no debe ocultar sus puntos.
    forkJoin({
      puntos: this.clubAlanService.obtenerPuntos(cliente.idCliente).pipe(catchError(() => of(null))),
      membresia: this.clubAlanService.obtenerMembresia(cliente.idCliente, true).pipe(catchError(() => of(null))),
      movimientos: this.clubAlanService.listarMovimientos(cliente.idCliente, 0, 5).pipe(
        catchError(() => of({ content: [] as MovimientoPuntos[] })),
      ),
    })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe(({ puntos, membresia, movimientos }) =>
        this.ficha.set({ puntos, membresia, movimientos: movimientos.content }),
      );
  }

  irA(ruta: 'puntos' | 'movimientos' | 'membresia'): void {
    this.router.navigate(['/admin/club-alan', ruta], { state: { cliente: this.cliente() } });
  }

  private cargarLista(): void {
    this.cargandoLista.set(true);
    this.clubAlanService
      .listarClientes(this.busqueda.value ?? '', this.pageIndex(), this.pageSize())
      .pipe(finalize(() => this.cargandoLista.set(false)))
      .subscribe((pagina) => {
        this.clientes.set(pagina.content);
        this.totalElements.set(pagina.totalElements);
      });
  }
}
