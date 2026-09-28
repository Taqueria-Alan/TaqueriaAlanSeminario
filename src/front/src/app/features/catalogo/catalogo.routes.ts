import { Routes } from '@angular/router';

export const CATALOGO_ROUTES: Routes = [
  { path: '', redirectTo: 'categorias', pathMatch: 'full' },
  {
    path: 'categorias',
    loadComponent: () =>
      import('./categoria-list/categoria-list').then((m) => m.CategoriaListComponent),
  },
  {
    path: 'categorias/nueva',
    loadComponent: () =>
      import('./categoria-form/categoria-form').then((m) => m.CategoriaFormComponent),
  },
  {
    path: 'categorias/:id',
    loadComponent: () =>
      import('./categoria-form/categoria-form').then((m) => m.CategoriaFormComponent),
  },
  {
    path: 'productos',
    loadComponent: () =>
      import('./producto-list/producto-list').then((m) => m.ProductoListComponent),
  },
  {
    path: 'productos/nuevo',
    loadComponent: () =>
      import('./producto-form/producto-form').then((m) => m.ProductoFormComponent),
  },
  {
    path: 'productos/:id',
    loadComponent: () =>
      import('./producto-form/producto-form').then((m) => m.ProductoFormComponent),
  },
];
