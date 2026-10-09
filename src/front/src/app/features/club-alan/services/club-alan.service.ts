import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../core/models/page.model';
import { environment } from '../../../../environments/environment';
import { OMITIR_NOTIFICACION_ERROR } from '../../../core/interceptors/error.interceptor';
import { ClienteBusqueda, ClienteListado, PuntosResponse } from '../models/cliente.model';
import { ClienteMembresia, Membresia } from '../models/membresia.model';
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

  /** Listado paginado de todos los clientes, con filtro opcional por nombre o telefono. */
  listarClientes(query: string, page: number, size: number): Observable<Page<ClienteListado>> {
    const params: Record<string, string> = { page: String(page), size: String(size) };
    if (query.trim()) {
      params['q'] = query.trim();
    }
    return this.http.get<Page<ClienteListado>>(this.baseUrl, { params });
  }

  /** Listado paginado de clientes con membresia, filtrado por estado: ACTIVA, INACTIVA o TODAS. */
  listarMiembros(
    estado: 'ACTIVA' | 'INACTIVA' | 'TODAS',
    page: number,
    size: number,
  ): Observable<Page<ClienteMembresia>> {
    return this.http.get<Page<ClienteMembresia>>(`${this.baseUrl}/miembros`, {
      params: { estado, page: String(page), size: String(size) },
    });
  }

  obtenerPuntos(idCliente: number, silencioso = false): Observable<PuntosResponse> {
    const context = new HttpContext().set(OMITIR_NOTIFICACION_ERROR, silencioso);
    return this.http.get<PuntosResponse>(`${this.baseUrl}/${idCliente}/puntos`, { context });
  }

  listarMovimientos(
    idCliente: number,
    page: number,
    size: number,
    silencioso = false,
  ): Observable<Page<MovimientoPuntos>> {
    const context = new HttpContext().set(OMITIR_NOTIFICACION_ERROR, silencioso);
    return this.http.get<Page<MovimientoPuntos>>(`${this.baseUrl}/${idCliente}/movimientos`, {
      params: { page: String(page), size: String(size), sort: 'fecha,desc' },
      context,
    });
  }

  /**
   * Con `silencioso` el interceptor no muestra snackbar si falla; el llamador decide
   * como presentar el caso (p. ej. un cliente que nunca tuvo membresia).
   */
  obtenerMembresia(idCliente: number, silencioso = false): Observable<Membresia> {
    const context = new HttpContext().set(OMITIR_NOTIFICACION_ERROR, silencioso);
    return this.http.get<Membresia>(`${this.baseUrl}/${idCliente}/membresia`, { context });
  }

  activarMembresia(idCliente: number): Observable<Membresia> {
    return this.http.post<Membresia>(`${this.baseUrl}/${idCliente}/membresia`, {});
  }

  cancelarMembresia(idCliente: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${idCliente}/membresia`);
  }
}
