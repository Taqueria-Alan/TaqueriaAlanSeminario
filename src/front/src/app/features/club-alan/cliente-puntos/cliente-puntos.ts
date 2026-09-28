import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { finalize } from 'rxjs';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ClienteSearchComponent } from '../cliente-search/cliente-search';
import { ClienteBusqueda, PuntosResponse } from '../models/cliente.model';
import { ClubAlanService } from '../services/club-alan.service';

@Component({
  selector: 'app-cliente-puntos',
  standalone: true,
  imports: [MatCardModule, LoadingSpinner, ClienteSearchComponent],
  templateUrl: './cliente-puntos.html',
  styleUrl: './cliente-puntos.scss',
})
export class ClientePuntosComponent {
  loading = false;
  buscado = false;
  clienteSeleccionado: ClienteBusqueda | null = null;
  puntos: PuntosResponse | null = null;

  constructor(private readonly clubAlanService: ClubAlanService) {}

  onClienteSeleccionado(cliente: ClienteBusqueda): void {
    this.clienteSeleccionado = cliente;
    this.loading = true;
    this.buscado = true;
    this.puntos = null;

    this.clubAlanService
      .obtenerPuntos(cliente.idCliente)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (puntos) => (this.puntos = puntos),
        error: () => (this.puntos = null),
      });
  }
}
