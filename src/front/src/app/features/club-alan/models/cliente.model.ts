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
