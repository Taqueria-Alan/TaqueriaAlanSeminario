export const environment = {
  production: false,
  authApiUrl: 'http://localhost:8081/api/auth',
  catalogoApiUrl: 'http://localhost:8082/api/catalogo',
  pedidosApiUrl: 'http://localhost:8083/api/pedidos',
  pagosApiUrl: 'http://localhost:8084/api/pagos',
  clubAlanApiUrl: 'http://localhost:8085/api/club-alan',
  /** Ya con auth-service integrado, el id del cliente viene de la sesion autenticada. */
  clienteDemoId: 5,
  securityEnabled: true,
};
