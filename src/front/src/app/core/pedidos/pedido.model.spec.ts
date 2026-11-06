import { describe, expect, it } from 'vitest';
import { accionDe, etiquetaTipoPedido, flujoDe, siguienteEstado, resumenLineas, type Pedido } from './pedido.model';

type Seguimiento = Pick<Pedido, 'tipo' | 'clase' | 'estado'>;
const llevar = { tipo: 'LLEVAR', clase: 'NORMAL', estado: 'RECIBIDO' } satisfies Seguimiento;
const domicilio = { ...llevar, tipo: 'DOMICILIO' } satisfies Seguimiento;
const membresia = { ...llevar, clase: 'SUSCRIPCION' } satisfies Seguimiento;

describe('Reglas de seguimiento de pedidos en el frontend', () => {
  it('un pedido para llevar no pasa por reparto', () => {
    expect(flujoDe(llevar)).toEqual(['RECIBIDO', 'EN_PREPARACION', 'ENTREGADO']);
  });
  it('la entrega a domicilio conserva el paso en ruta', () => {
    expect(flujoDe(domicilio)).toEqual(['RECIBIDO', 'EN_PREPARACION', 'EN_RUTA', 'ENTREGADO']);
  });
  it('una suscripción solo tiene recepción y activación', () => {
    expect(flujoDe(membresia)).toEqual(['RECIBIDO', 'ENTREGADO']);
  });
  it('una cancelación muestra únicamente el estado terminal', () => {
    expect(flujoDe({ ...domicilio, estado: 'CANCELADO' })).toEqual(['CANCELADO']);
  });
  it('un pedido recibido avanza a preparación', () => {
    expect(siguienteEstado(llevar)).toBe('EN_PREPARACION');
  });
  it('un pedido para llevar pasa de preparación a entrega', () => {
    expect(siguienteEstado({ ...llevar, estado: 'EN_PREPARACION' })).toBe('ENTREGADO');
  });
  it('un pedido a domicilio pasa de preparación a reparto', () => {
    expect(siguienteEstado({ ...domicilio, estado: 'EN_PREPARACION' })).toBe('EN_RUTA');
  });
  it('el repartidor puede completar una entrega en ruta', () => {
    expect(siguienteEstado({ ...domicilio, estado: 'EN_RUTA' })).toBe('ENTREGADO');
  });
  it('la membresía recibida termina al activarse', () => {
    expect(siguienteEstado(membresia)).toBe('ENTREGADO');
  });
  it('un pedido entregado ya no avanza', () => {
    expect(siguienteEstado({ ...domicilio, estado: 'ENTREGADO' })).toBeNull();
  });
  it('un pedido cancelado no ofrece transición ni acción', () => {
    const cancelado = { ...llevar, estado: 'CANCELADO' } satisfies Seguimiento;
    expect(siguienteEstado(cancelado)).toBeNull();
    expect(accionDe(cancelado)).toBe('');
  });
  it('la acción de membresía indica activación, no preparación', () => {
    expect(accionDe(membresia)).toBe('Activar membresía');
    expect(etiquetaTipoPedido(membresia)).toBe('Suscripción Club Alan');
  });
  it('el botón de preparación distingue despacho de entrega en tienda', () => {
    expect(accionDe({ ...domicilio, estado: 'EN_PREPARACION' })).toBe('Enviar');
    expect(accionDe({ ...llevar, estado: 'EN_PREPARACION' })).toBe('Entregar');
  });
  it('el resumen muestra multiplicador solo cuando hay varias unidades', () => {
    expect(resumenLineas([
      { idProducto: 2, nombre: 'Tacos', detalle: '', precio: 18, cantidad: 2 },
      { idProducto: 3, nombre: 'Gringa', detalle: '', precio: 15, cantidad: 1 },
    ])).toBe('2 × Tacos + Gringa');
  });
});
