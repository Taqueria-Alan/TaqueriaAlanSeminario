import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = extractMessage(error);
      notificationService.error(message);
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
