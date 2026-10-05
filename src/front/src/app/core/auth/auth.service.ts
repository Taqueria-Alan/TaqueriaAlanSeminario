import { Injectable, computed, signal } from '@angular/core';
import { Observable, defer, delay } from 'rxjs';
import { LoginRequest, RegistroRequest, Rol, Usuario } from './auth.model';

/**
 * AUTENTICACION SIMULADA.
 *
 * auth-service todavia no expone endpoints, asi que usuarios y sesion viven en
 * localStorage. Las firmas (Observable<Usuario>) estan pensadas para sustituir
 * el cuerpo de `login` y `registrar` por llamadas HttpClient al auth-service sin
 * tocar los componentes. Los datos solo existen en este navegador.
 */

const USUARIOS_KEY = 'taqueria_mock_usuarios';
const SESION_KEY = 'taqueria_session';
const LATENCIA_MS = 350;

interface UsuarioGuardado extends Usuario {
  passwordHash: string;
}

/** Cuenta de personal para probar el panel admin (solo demo). */
const ADMIN_DEMO = {
  email: 'admin@taqueriaalan.com',
  password: 'Admin1234',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _usuario = signal<Usuario | null>(this.leerSesion());

  readonly usuario = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._usuario() !== null);
  readonly rol = computed<Rol | null>(() => this._usuario()?.rol ?? null);

  /** Ruta de inicio segun el rol de la sesion actual. */
  rutaInicio(): string {
    return this.rol() === 'ADMIN' ? '/admin' : '/cliente';
  }

  login(request: LoginRequest): Observable<Usuario> {
    return defer(() => this.loginLocal(request)).pipe(delay(LATENCIA_MS));
  }

  registrar(request: RegistroRequest): Observable<Usuario> {
    return defer(() => this.registrarLocal(request)).pipe(delay(LATENCIA_MS));
  }

  /**
   * Marca al cliente como miembro del Club Alan. En el backend real lo hace
   * pedidos-service llamando a club-alan-service cuando el pedido de suscripcion se completa.
   */
  activarMembresiaSimulada(idCliente: number): void {
    try {
      const usuarios: UsuarioGuardado[] = JSON.parse(localStorage.getItem(USUARIOS_KEY) ?? '[]');
      localStorage.setItem(
        USUARIOS_KEY,
        JSON.stringify(usuarios.map((u) => (u.id === idCliente ? { ...u, miembroClub: true } : u))),
      );
    } catch {
      // Sin datos guardados no hay nada que actualizar.
    }
    const actual = this._usuario();
    if (actual?.id === idCliente) {
      const actualizado = { ...actual, miembroClub: true };
      this._usuario.set(actualizado);
      localStorage.setItem(SESION_KEY, JSON.stringify(actualizado));
    }
  }

  logout(): void {
    this._usuario.set(null);
    localStorage.removeItem(SESION_KEY);
  }

  private async loginLocal(request: LoginRequest): Promise<Usuario> {
    const email = request.email.trim().toLowerCase();
    const hash = await this.hash(request.password);
    const encontrado = (await this.leerUsuarios()).find(
      (u) => u.email === email && u.passwordHash === hash,
    );
    if (!encontrado) {
      throw new Error('Correo o contraseña incorrectos');
    }
    return this.abrirSesion(encontrado);
  }

  private async registrarLocal(request: RegistroRequest): Promise<Usuario> {
    const usuarios = await this.leerUsuarios();
    const email = request.email.trim().toLowerCase();
    if (usuarios.some((u) => u.email === email)) {
      throw new Error('Ya existe una cuenta con ese correo');
    }
    const nuevo: UsuarioGuardado = {
      id: Math.max(0, ...usuarios.map((u) => u.id)) + 1,
      nombre: request.nombre.trim(),
      apellido: request.apellido.trim(),
      email,
      telefono: request.telefono.trim(),
      rol: 'CLIENTE',
      miembroClub: false,
      passwordHash: await this.hash(request.password),
    };
    localStorage.setItem(USUARIOS_KEY, JSON.stringify([...usuarios, nuevo]));
    return this.abrirSesion(nuevo);
  }

  private abrirSesion({ passwordHash: _omitido, ...usuario }: UsuarioGuardado): Usuario {
    localStorage.setItem(SESION_KEY, JSON.stringify(usuario));
    this._usuario.set(usuario);
    return usuario;
  }

  private async leerUsuarios(): Promise<UsuarioGuardado[]> {
    try {
      const guardados = JSON.parse(localStorage.getItem(USUARIOS_KEY) ?? 'null');
      if (Array.isArray(guardados) && guardados.length > 0) {
        return guardados;
      }
    } catch {
      // Datos corruptos: se reinician con la cuenta demo.
    }
    const semilla: UsuarioGuardado[] = [
      {
        id: 1,
        nombre: 'Administrador',
        apellido: 'Taquería Alan',
        email: ADMIN_DEMO.email,
        telefono: '',
        rol: 'ADMIN',
        passwordHash: await this.hash(ADMIN_DEMO.password),
      },
    ];
    localStorage.setItem(USUARIOS_KEY, JSON.stringify(semilla));
    return semilla;
  }

  private leerSesion(): Usuario | null {
    try {
      return JSON.parse(localStorage.getItem(SESION_KEY) ?? 'null');
    } catch {
      return null;
    }
  }

  private async hash(texto: string): Promise<string> {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
  }
}

export function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado';
}
