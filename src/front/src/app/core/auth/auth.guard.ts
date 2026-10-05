import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from './auth.model';
import { AuthService } from './auth.service';

/**
 * Protege rutas por sesion y, opcionalmente, por rol (`data: { rol: 'ADMIN' }`).
 * Sin sesion redirige a /login; con otro rol, al inicio de su propio panel.
 */
export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const rolRequerido = route.data['rol'] as Rol | undefined;

  if (!auth.autenticado()) {
    return router.createUrlTree(['/login']);
  }
  if (rolRequerido && auth.rol() !== rolRequerido) {
    return router.createUrlTree([auth.rutaInicio()]);
  }
  return true;
};

/** Impide ver /login y /registro con una sesion activa. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.autenticado() ? inject(Router).createUrlTree([auth.rutaInicio()]) : true;
};
