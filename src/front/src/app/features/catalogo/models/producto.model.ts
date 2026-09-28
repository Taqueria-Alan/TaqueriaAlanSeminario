export interface Producto {
  idProducto: number;
  idCategoria: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
}

export interface ProductoRequest {
  idCategoria: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
}

export interface ProductoConCategoria {
  idProducto: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  nombreCategoria: string;
}
