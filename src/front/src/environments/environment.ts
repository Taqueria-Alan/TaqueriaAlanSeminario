export const environment = {
  production: false,
  catalogoApiUrl: 'http://localhost:8082/api/catalogo',
  pedidosApiUrl: 'http://localhost:8083/api/pedidos',
  pagosApiUrl: 'http://localhost:8084/api/pagos',
  clubAlanApiUrl: 'http://localhost:8085/api/club-alan',
  /**
   * Mientras auth-service se integra, el front local usa el cliente de prueba
   * que existe en la base de datos Docker. En entornos con JWT esta bandera se
   * activa y se utiliza el id contenido en la sesion autenticada.
   */
  clienteDemoId: 5,
  securityEnabled: false,
};
