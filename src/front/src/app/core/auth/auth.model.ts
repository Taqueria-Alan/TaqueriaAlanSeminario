export type Rol = 'CLIENTE' | 'ADMIN';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: Rol;
  /** Espejo simulado de CLIENTE.miembro_club; el valor real lo da club-alan-service. */
  miembroClub?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegistroRequest {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  password: string;
}
