import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { PedidoService } from '../../core/pedidos/pedido.service';

interface EnlaceMenu {
  ruta: string;
  icono: string;
  texto: string;
}

interface SeccionMenu {
  titulo: string | null;
  enlaces: EnlaceMenu[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly pedidoService = inject(PedidoService);

  readonly usuario = this.auth.usuario;

  readonly secciones: SeccionMenu[] = [
    {
      titulo: null,
      enlaces: [
        { ruta: '/admin/resumen', icono: 'dashboard', texto: 'Resumen' },
        { ruta: '/admin/pedidos', icono: 'receipt_long', texto: 'Pedidos' },
        { ruta: '/admin/catalogo/productos', icono: 'lunch_dining', texto: 'Menú' },
        { ruta: '/admin/catalogo/categorias', icono: 'category', texto: 'Categorías' },
        { ruta: '/admin/clientes', icono: 'group', texto: 'Clientes' },
        { ruta: '/admin/reportes', icono: 'bar_chart', texto: 'Reportes' },
      ],
    },
    {
      titulo: 'Club Alan',
      enlaces: [
        { ruta: '/admin/club-alan/puntos', icono: 'loyalty', texto: 'Puntos' },
        { ruta: '/admin/club-alan/movimientos', icono: 'swap_vert', texto: 'Movimientos' },
        { ruta: '/admin/club-alan/membresia', icono: 'card_membership', texto: 'Membresía' },
      ],
    },
    {
      titulo: 'Negocio',
      enlaces: [{ ruta: '/admin/ajustes', icono: 'settings', texto: 'Ajustes' }],
    },
  ];

  /** Pedidos nuevos de hoy que esperan ser aceptados (se muestra junto a "Pedidos"). */
  readonly pedidosNuevos = computed(() => {
    const hoy = new Date().toDateString();
    return this.pedidoService
      .pedidos()
      .filter((p) => p.estado === 'RECIBIDO' && new Date(p.creadoEn).toDateString() === hoy).length;
  });

  readonly isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches)),
    { initialValue: this.breakpointObserver.isMatched(Breakpoints.Handset) },
  );

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
