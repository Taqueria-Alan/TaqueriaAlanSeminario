export interface MenuItem {
  id: number;
  nombre: string;
  detalle: string;
  precio: number;
}

export interface MenuCategoria {
  titulo: string;
  icono: string;
  items: MenuItem[];
}

/**
 * Categoria del catalogo que agrupa productos de servicio (no son comida). El producto
 * de esta categoria que vende la suscripcion al Club Alan se ofrece aparte del menu.
 */
export const CATEGORIA_SERVICIOS = 'servicios';

const CARNES = 'Pastor, pollo, chorizo, longaniza o 2 carnes';
const RES_ADOBADO_MIXTO = 'Res, adobado o mixto';
const GUARNICIONES = 'Pan horneado, guarniciones frescas';

/**
 * Menu oficial de la taqueria. Se usa en la landing y como respaldo del
 * panel de cliente cuando el catalogo-service no responde o no tiene productos.
 * Los ids son locales (>= 1000) y no corresponden a registros del catalogo.
 */
export const MENU_ESTATICO: MenuCategoria[] = [
  {
    titulo: 'Tacos',
    icono: 'lunch_dining',
    items: [
      { id: 1001, nombre: '3 Tacos', detalle: CARNES, precio: 18 },
      { id: 1002, nombre: '3 Tacos', detalle: 'Res y adobado', precio: 24 },
      { id: 1003, nombre: '4 Tacos', detalle: CARNES, precio: 24 },
      { id: 1004, nombre: '4 Tacos', detalle: 'Res y adobado', precio: 30 },
    ],
  },
  {
    titulo: 'Gringas',
    icono: 'flatware',
    items: [
      { id: 1011, nombre: 'Pequeña', detalle: CARNES, precio: 12 },
      { id: 1012, nombre: 'Super', detalle: RES_ADOBADO_MIXTO, precio: 24 },
      { id: 1013, nombre: 'Jumbo', detalle: RES_ADOBADO_MIXTO, precio: 40 },
      { id: 1014, nombre: 'Porción de 3 pequeñas', detalle: RES_ADOBADO_MIXTO, precio: 40 },
    ],
  },
  {
    titulo: 'Tortillas de harina',
    icono: 'bakery_dining',
    items: [
      { id: 1021, nombre: 'Pequeña', detalle: CARNES, precio: 18 },
      { id: 1022, nombre: 'Normal', detalle: RES_ADOBADO_MIXTO, precio: 30 },
      { id: 1023, nombre: 'Gigante', detalle: RES_ADOBADO_MIXTO, precio: 40 },
    ],
  },
  {
    titulo: 'Tortas y hamburguesas',
    icono: 'kebab_dining',
    items: [
      { id: 1031, nombre: 'Torta de embutidos', detalle: GUARNICIONES, precio: 18 },
      { id: 1032, nombre: 'Torta de carne especial', detalle: GUARNICIONES, precio: 25 },
      { id: 1033, nombre: 'Hamburguesa', detalle: 'Carne especial de la casa', precio: 16 },
    ],
  },
];
