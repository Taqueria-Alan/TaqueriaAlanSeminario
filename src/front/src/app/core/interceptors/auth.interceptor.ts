import { HttpInterceptorFn } from '@angular/common/http';

/**
 * La sesion viaja en una cookie httpOnly (nunca en localStorage ni en un header que el
 * JS pueda leer o adjuntar a mano): esto solo asegura que el navegador la incluya en
 * cada peticion a los microservicios, aunque esten en otro puerto/origen.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => next(req.clone({ withCredentials: true }));
