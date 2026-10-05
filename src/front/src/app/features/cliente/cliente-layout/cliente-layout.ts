import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-cliente-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './cliente-layout.html',
  styleUrl: './cliente-layout.scss',
})
export class ClienteLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuario = this.auth.usuario;
  readonly iniciales = computed(() => {
    const u = this.usuario();
    return u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}`.toUpperCase() : '';
  });

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
