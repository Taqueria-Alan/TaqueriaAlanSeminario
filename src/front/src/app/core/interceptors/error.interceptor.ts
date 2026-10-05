import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

/** Marca una peticion para que sus errores no muestren notificacion (el llamador los maneja). */
export const OMITIR_NOTIFICACION_ERROR = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!req.context.get(OMITIR_NOTIFICACION_ERROR)) {
        notificationService.error(extractMessage(error));
      }
      return throwError(() => error);
    }),
  );
};

function extractMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. Verifica tu conexion.';
  }
  if (error.error && typeof error.error === 'object' && 'message' in error.error) {
    return String((error.error as { message: unknown }).message);
  }
  if (error.status >= 400 && error.status < 500) {
    return `Solicitud invalida (${error.status}): ${error.statusText}`;
  }
  return `Error del servidor (${error.status}): ${error.statusText}`;
}
