import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OMITIR_NOTIFICACION_ERROR } from '../interceptors/error.interceptor';
import { ActualizarPerfilRequest, LoginRequest, RegistroRequest, Rol, Usuario } from './auth.model';

/**
 * La sesion vive en una cookie httpOnly que emite auth-service (ver JwtCookieFilter /
 * AuthController): este servicio nunca la lee ni la escribe directamente, solo manda
 * `withCredentials: true` para que el navegador la incluya. Por eso no hay nada que
 * guardar en localStorage ni que adjuntar manualmente en un header.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.authApiUrl;

  private readonly _usuario = signal<Usuario | null>(null);
  /** true una vez que restaurarSesion() ya respondio (exito o no) al cargar la app. */
  private readonly _listo = signal(false);

  readonly usuario = this._usuario.asReadonly();
  readonly listo = this._listo.asReadonly();
  readonly autenticado = computed(() => this._usuario() !== null);
  readonly rol = computed<Rol | null>(() => this._usuario()?.rol ?? null);

  /** Ruta de inicio segun el rol de la sesion actual. */
  rutaInicio(): string {
    return this.rol() === 'ADMIN' ? '/admin' : '/cliente';
  }

  /** Se llama una sola vez al iniciar la app (ver app.config.ts) para saber si ya hay sesion. */
  restaurarSesion(): Observable<void> {
    const context = new HttpContext().set(OMITIR_NOTIFICACION_ERROR, true);
    return this.http.get<Usuario>(`${this.baseUrl}/me`, { withCredentials: true, context }).pipe(
      tap((usuario) => this._usuario.set(usuario)),
      catchError(() => {
        this._usuario.set(null);
        return of(null);
      }),
      tap(() => this._listo.set(true)),
      map(() => void 0),
    );
  }

  login(request: LoginRequest): Observable<Usuario> {
    const context = new HttpContext().set(OMITIR_NOTIFICACION_ERROR, true);
    return this.http
      .post<Usuario>(`${this.baseUrl}/login`, request, { withCredentials: true, context })
      .pipe(tap((usuario) => this._usuario.set(usuario)));
  }

  registrar(request: RegistroRequest): Observable<Usuario> {
    const context = new HttpContext().set(OMITIR_NOTIFICACION_ERROR, true);
    // USUARIO solo tiene una columna de nombre: se concatena antes de mandarlo al backend.
    const { apellido, ...resto } = request;
    const body = { ...resto, nombre: `${request.nombre} ${apellido}`.trim() };
    return this.http
      .post<Usuario>(`${this.baseUrl}/registro`, body, { withCredentials: true, context })
      .pipe(tap((usuario) => this._usuario.set(usuario)));
  }

  /** El cliente edita su propia ficha (nombre, correo, telefono) desde su sesion. */
  actualizarPerfil(request: ActualizarPerfilRequest): Observable<Usuario> {
    return this.http
      .put<Usuario>(`${this.baseUrl}/me`, request, { withCredentials: true })
      .pipe(tap((usuario) => this._usuario.set(usuario)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this._usuario.set(null)));
  }
}

export function mensajeDeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    }
    const body = error.error;
    if (body && typeof body === 'object' && 'message' in body) {
      return String((body as { message: unknown }).message);
    }
    return `Error del servidor (${error.status})`;
  }
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado';
}
