export interface Membresia {
  idMembresia: number;
  idCliente: number;
  envioGratis: boolean;
  fechaInicio: string;
  fechaFin: string | null;
  activa: boolean;
}

/** Fila del listado de miembros (vista "Membresía" del panel admin). */
export interface ClienteMembresia {
  idCliente: number;
  nombre: string;
  telefono: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  envioGratis: boolean;
  activa: boolean;
}
