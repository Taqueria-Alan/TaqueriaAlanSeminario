export type Rol = 'CLIENTE' | 'ADMIN';

/**
 * id = idCliente cuando el rol es CLIENTE (el mismo id que usan pedidos-service,
 * club-alan-service, etc.); idUsuario si es ADMIN. nombre es el nombre completo:
 * auth-service solo guarda una columna de nombre, no nombre/apellido por separado.
 */
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  rol: Rol;
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

export interface ActualizarPerfilRequest {
  nombre: string;
  email: string;
  telefono: string;
}
