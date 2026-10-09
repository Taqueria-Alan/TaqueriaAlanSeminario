export interface PuntosResponse {
  idCliente: number;
  puntos: number;
  miembroClub: boolean;
}

export interface ClienteBusqueda {
  idCliente: number;
  nombre: string;
  telefono: string | null;
  puntos: number;
  miembroClub: boolean;
}

/** Fila del listado paginado de clientes (vista "Clientes" del panel admin). */
export interface ClienteListado {
  idCliente: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
  puntosClubAlan: number;
  miembroClub: boolean;
}
