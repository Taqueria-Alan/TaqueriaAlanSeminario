import { AfterViewInit, Component, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ClienteSearchComponent } from '../cliente-search/cliente-search';
import { ClienteBusqueda, PuntosResponse } from '../models/cliente.model';
import { ClubAlanService } from '../services/club-alan.service';

@Component({
  selector: 'app-cliente-puntos',
  standalone: true,
  imports: [ClienteSearchComponent],
  templateUrl: './cliente-puntos.html',
  styleUrl: './cliente-puntos.scss',
})
export class ClientePuntosComponent implements AfterViewInit {
  private readonly clubAlanService = inject(ClubAlanService);
  private readonly router = inject(Router);

  @ViewChild(ClienteSearchComponent) private buscador?: ClienteSearchComponent;

  readonly cargando = signal(false);
  readonly buscado = signal(false);
  readonly cliente = signal<ClienteBusqueda | null>(null);
  readonly puntos = signal<PuntosResponse | null>(null);

  ngAfterViewInit(): void {
    // Llega con un cliente ya elegido cuando se navega desde otra pantalla del Club.
    const previo = history.state?.['cliente'] as ClienteBusqueda | undefined;
    if (previo) {
      this.buscador?.establecer(previo);
      this.onClienteSeleccionado(previo);
    }
  }

  onClienteSeleccionado(cliente: ClienteBusqueda): void {
    this.cliente.set(cliente);
    this.cargando.set(true);
    this.buscado.set(true);
    this.puntos.set(null);

    this.clubAlanService
      .obtenerPuntos(cliente.idCliente)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (puntos) => this.puntos.set(puntos),
        error: () => this.puntos.set(null),
      });
  }

  irA(ruta: 'movimientos' | 'membresia'): void {
    this.router.navigate(['/admin/club-alan', ruta], { state: { cliente: this.cliente() } });
  }
}
