import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Categoria, CategoriaRequest } from '../models/categoria.model';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly baseUrl = `${environment.catalogoApiUrl}/categorias`;

  constructor(private readonly http: HttpClient) {}

  listar(activa?: boolean): Observable<Categoria[]> {
    const params: Record<string, string> = {};
    if (activa !== undefined) {
      params['activa'] = String(activa);
    }
    return this.http.get<Categoria[]>(this.baseUrl, { params });
  }

  obtenerPorId(idCategoria: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.baseUrl}/${idCategoria}`);
  }

  crear(request: CategoriaRequest): Observable<Categoria> {
    return this.http.post<Categoria>(this.baseUrl, request);
  }

  actualizar(idCategoria: number, request: CategoriaRequest): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.baseUrl}/${idCategoria}`, request);
  }

  eliminar(idCategoria: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${idCategoria}`);
  }
}
