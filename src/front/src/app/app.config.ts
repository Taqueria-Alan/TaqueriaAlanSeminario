import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es-GT';
import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

// Fechas y numeros de pipes (date, number) en español.
registerLocaleData(localeEs, 'es-GT');

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-GT' },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    // Antes de mostrar cualquier ruta, pregunta a auth-service si la cookie httpOnly
    // sigue siendo una sesion valida (reemplaza leer un usuario de localStorage).
    provideAppInitializer(() => firstValueFrom(inject(AuthService).restaurarSesion())),
  ],
};
