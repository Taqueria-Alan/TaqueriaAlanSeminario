export const environment = {
  production: false,
  // Todo pasa por el gateway (8080); evita depender de cookies entre puertos distintos.
  authApiUrl: 'http://localhost:8080/api/auth',
  catalogoApiUrl: 'http://localhost:8080/api/catalogo',
  pedidosApiUrl: 'http://localhost:8080/api/pedidos',
  pagosApiUrl: 'http://localhost:8080/api/pagos',
  clubAlanApiUrl: 'http://localhost:8080/api/club-alan',
  /** Ya con auth-service integrado, el id del cliente viene de la sesion autenticada. */
  clienteDemoId: 5,
  securityEnabled: true,
};
