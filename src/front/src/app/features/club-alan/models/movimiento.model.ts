export type TipoMovimiento = 'ACUMULACION' | 'CANJE';

export interface MovimientoPuntos {
  idMovimiento: number;
  idCliente: number;
  idPedido: number | null;
  tipo: TipoMovimiento;
  puntos: number;
  fecha: string;
  descripcion: string | null;
  saldoActual: number | null;
}
