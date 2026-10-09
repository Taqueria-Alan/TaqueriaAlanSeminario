import { Routes } from '@angular/router';
import { authGuard, invitadoGuard } from './core/auth/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    canActivate: [invitadoGuard],
    loadComponent: () =>
      import('./features/auth/registro/registro').then((m) => m.RegistroComponent),
  },
  {
    path: 'cliente',
    canActivate: [authGuard],
    data: { rol: 'CLIENTE' },
    loadComponent: () =>
      import('./features/cliente/cliente-layout/cliente-layout').then(
        (m) => m.ClienteLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/cliente/cliente-inicio/cliente-inicio').then(
            (m) => m.ClienteInicioComponent,
          ),
      },
      {
        path: 'pedir',
        loadComponent: () =>
          import('./features/cliente/cliente-pedir/cliente-pedir').then(
            (m) => m.ClientePedirComponent,
          ),
      },
      {
        path: 'pago/:id',
        loadComponent: () =>
          import('./features/cliente/cliente-pago/cliente-pago').then(
            (m) => m.ClientePagoComponent,
          ),
      },
      {
        path: 'confirmacion/:id',
        loadComponent: () =>
          import('./features/cliente/cliente-confirmacion/cliente-confirmacion').then(
            (m) => m.ClienteConfirmacionComponent,
          ),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/cliente/cliente-perfil/cliente-perfil').then(
            (m) => m.ClientePerfilComponent,
          ),
      },
    ],
  },
  {
    path: 'admin',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    data: { rol: 'ADMIN' },
    children: [
      { path: '', redirectTo: 'resumen', pathMatch: 'full' },
      {
        path: 'resumen',
        loadComponent: () =>
          import('./features/admin-resumen/admin-resumen').then((m) => m.AdminResumenComponent),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./features/admin-pedidos/admin-pedidos').then((m) => m.AdminPedidosComponent),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/admin-clientes/admin-clientes').then((m) => m.AdminClientesComponent),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/admin-reportes/admin-reportes').then((m) => m.AdminReportesComponent),
      },
      {
        path: 'ajustes',
        loadComponent: () =>
          import('./features/admin-ajustes/admin-ajustes').then((m) => m.AdminAjustesComponent),
      },
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
  { path: '**', redirectTo: '' },
];
