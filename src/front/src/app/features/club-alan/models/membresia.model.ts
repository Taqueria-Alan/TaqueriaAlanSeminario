export interface Membresia {
  idMembresia: number;
  idCliente: number;
  envioGratis: boolean;
  fechaInicio: string;
  fechaFin: string | null;
  activa: boolean;
}
