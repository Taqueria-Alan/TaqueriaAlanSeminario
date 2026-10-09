import { Routes } from '@angular/router';

export const CLUB_ALAN_ROUTES: Routes = [
  { path: '', redirectTo: 'puntos', pathMatch: 'full' },
  {
    path: 'puntos',
    loadComponent: () =>
      import('./cliente-puntos/cliente-puntos').then((m) => m.ClientePuntosComponent),
  },
  {
    path: 'movimientos',
    loadComponent: () =>
      import('./movimientos-list/movimientos-list').then((m) => m.MovimientosListComponent),
  },
  {
    path: 'membresia',
    loadComponent: () => import('./membresia/membresia').then((m) => m.MembresiaComponent),
  },
];
