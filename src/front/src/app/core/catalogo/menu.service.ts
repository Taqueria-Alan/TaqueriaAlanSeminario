import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CATEGORIA_SERVICIOS, MENU_ESTATICO, MenuCategoria, MenuItem } from '../data/menu.data';
import { OMITIR_NOTIFICACION_ERROR } from '../interceptors/error.interceptor';
import { ProductoConCategoria } from '../../features/catalogo/models/producto.model';

const ICONOS: Record<string, string> = Object.fromEntries(
  MENU_ESTATICO.map((c) => [c.titulo.toLowerCase(), c.icono]),
);

export interface MenuCliente {
  /** Productos de comida, agrupados por categoria. */
  menu: MenuCategoria[];
  /** Producto de servicio que vende la suscripcion al Club Alan; null si no esta en el catalogo. */
  suscripcion: MenuItem | null;
  /** true cuando el menu viene del respaldo local y no del catalogo-service. */
  respaldo: boolean;
}

/**
 * Menu que ve el cliente al pedir. Lee los productos disponibles de
 * catalogo-service; si el servicio no responde o no tiene productos, usa el
 * menu oficial de `MENU_ESTATICO` para que el cliente siempre pueda ver la carta.
 *
 * Los productos de la categoria "Servicios" no son comida: se separan del menu y el
 * de la suscripcion al Club Alan (el que se llame "Club Alan" o "Membresia", o el
 * primero de la categoria) se devuelve en `suscripcion`.
 */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);

  cargar(): Observable<MenuCliente> {
    const context = new HttpContext().set(OMITIR_NOTIFICACION_ERROR, true);
    return this.http
      .get<ProductoConCategoria[]>(`${environment.catalogoApiUrl}/productos/con-categoria`, {
        context,
      })
      .pipe(
        map((productos) => separar(productos.filter((p) => p.disponible))),
        map((cliente) => (cliente.menu.length > 0 ? cliente : respaldo())),
        catchError(() => of(respaldo())),
      );
  }
}

function respaldo(): MenuCliente {
  return { menu: MENU_ESTATICO, suscripcion: null, respaldo: true };
}

function esServicio(p: ProductoConCategoria): boolean {
  return p.nombreCategoria.trim().toLowerCase() === CATEGORIA_SERVICIOS;
}

function aItem(p: ProductoConCategoria): MenuItem {
  return { id: p.idProducto, nombre: p.nombre, detalle: p.descripcion ?? '', precio: p.precio };
}

function separar(productos: ProductoConCategoria[]): MenuCliente {
  const servicios = productos.filter(esServicio);
  const elegido =
    servicios.find((p) => /club alan|membres/i.test(p.nombre)) ?? servicios[0] ?? null;

  const grupos = new Map<string, MenuCategoria>();
  for (const p of productos.filter((p) => !esServicio(p))) {
    const grupo = grupos.get(p.nombreCategoria) ?? {
      titulo: p.nombreCategoria,
      icono: ICONOS[p.nombreCategoria.toLowerCase()] ?? 'restaurant',
      items: [],
    };
    grupo.items.push(aItem(p));
    grupos.set(p.nombreCategoria, grupo);
  }
  return { menu: [...grupos.values()], suscripcion: elegido ? aItem(elegido) : null, respaldo: false };
}
