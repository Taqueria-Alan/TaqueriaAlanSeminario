import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../core/models/page.model';
import { environment } from '../../../../environments/environment';
import { ClienteBusqueda, PuntosResponse } from '../models/cliente.model';
import { Membresia } from '../models/membresia.model';
import { MovimientoPuntos } from '../models/movimiento.model';

@Injectable({ providedIn: 'root' })
export class ClubAlanService {
  private readonly baseUrl = `${environment.clubAlanApiUrl}/clientes`;

  constructor(private readonly http: HttpClient) {}

  buscarClientes(query: string): Observable<ClienteBusqueda[]> {
    return this.http.get<ClienteBusqueda[]>(`${this.baseUrl}/buscar`, {
      params: { q: query },
    });
  }

  obtenerPuntos(idCliente: number): Observable<PuntosResponse> {
    return this.http.get<PuntosResponse>(`${this.baseUrl}/${idCliente}/puntos`);
  }

  listarMovimientos(
    idCliente: number,
    page: number,
    size: number,
  ): Observable<Page<MovimientoPuntos>> {
    return this.http.get<Page<MovimientoPuntos>>(`${this.baseUrl}/${idCliente}/movimientos`, {
      params: { page: String(page), size: String(size), sort: 'fecha,desc' },
    });
  }

  obtenerMembresia(idCliente: number): Observable<Membresia> {
    return this.http.get<Membresia>(`${this.baseUrl}/${idCliente}/membresia`);
  }

  activarMembresia(idCliente: number): Observable<Membresia> {
    return this.http.post<Membresia>(`${this.baseUrl}/${idCliente}/membresia`, {});
  }

  cancelarMembresia(idCliente: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${idCliente}/membresia`);
  }
}
