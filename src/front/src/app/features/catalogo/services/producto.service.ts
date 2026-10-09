import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Producto,
  ProductoConCategoria,
  ProductoRequest,
} from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly baseUrl = `${environment.catalogoApiUrl}/productos`;

  constructor(private readonly http: HttpClient) {}

  listar(idCategoria?: number, disponible?: boolean): Observable<Producto[]> {
    const params: Record<string, string> = {};
    if (idCategoria !== undefined) {
      params['idCategoria'] = String(idCategoria);
    }
    if (disponible !== undefined) {
      params['disponible'] = String(disponible);
    }
    return this.http.get<Producto[]>(this.baseUrl, { params });
  }

  listarConCategoria(): Observable<ProductoConCategoria[]> {
    return this.http.get<ProductoConCategoria[]>(`${this.baseUrl}/con-categoria`);
  }

  obtenerPorId(idProducto: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.baseUrl}/${idProducto}`);
  }

  crear(request: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.baseUrl, request);
  }

  actualizar(idProducto: number, request: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/${idProducto}`, request);
  }

  actualizarDisponibilidad(idProducto: number, disponible: boolean): Observable<Producto> {
    return this.http.patch<Producto>(`${this.baseUrl}/${idProducto}/disponibilidad`, {
      disponible,
    });
  }

  eliminar(idProducto: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${idProducto}`);
  }
}
