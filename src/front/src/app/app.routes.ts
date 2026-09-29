import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing').then((m) => m.LandingComponent),
  },
  {
    path: 'admin',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'catalogo', pathMatch: 'full' },
      {
        path: 'catalogo',
        loadChildren: () =>
          import('./features/catalogo/catalogo.routes').then((m) => m.CATALOGO_ROUTES),
      },
      {
        path: 'club-alan',
        loadChildren: () =>
          import('./features/club-alan/club-alan.routes').then((m) => m.CLUB_ALAN_ROUTES),
      },
    ],
  },
];
