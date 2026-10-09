export interface Categoria {
  idCategoria: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
}

export interface CategoriaRequest {
  nombre: string;
  descripcion: string | null;
  activa: boolean;
}
