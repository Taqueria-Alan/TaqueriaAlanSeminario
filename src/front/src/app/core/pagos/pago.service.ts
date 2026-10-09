import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResultadoPago, SolicitudPago } from './pago.model';

/** Adaptador del flujo de pago de demostración hacia pagos-service. */
@Injectable({ providedIn: 'root' })
export class PagoService {
  private readonly http = inject(HttpClient);

  pagar(solicitud: SolicitudPago): Observable<ResultadoPago> {
    const idempotencyKey = solicitud.idempotencyKey ?? crearClaveIdempotencia();
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    const { idempotencyKey: _omitida, ...cuerpo } = solicitud;
    return this.http.post<ResultadoPago>(environment.pagosApiUrl, cuerpo, { headers });
  }

  obtener(idPedido: number): Observable<ResultadoPago> {
    return this.http.get<ResultadoPago>(`${environment.pagosApiUrl}/${idPedido}`);
  }
}

function crearClaveIdempotencia(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `pago-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
