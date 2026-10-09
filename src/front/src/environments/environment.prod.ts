export const environment = {
  production: true,
  // Todo pasa por el gateway: una sola cookie de sesion para los 5 servicios,
  // sin importar que cada uno viva en su propio subdominio de azurewebsites.net.
  authApiUrl: 'https://taqueria-gateway-service.azurewebsites.net/api/auth',
  catalogoApiUrl: 'https://taqueria-gateway-service.azurewebsites.net/api/catalogo',
  pedidosApiUrl: 'https://taqueria-gateway-service.azurewebsites.net/api/pedidos',
  pagosApiUrl: 'https://taqueria-gateway-service.azurewebsites.net/api/pagos',
  clubAlanApiUrl: 'https://taqueria-gateway-service.azurewebsites.net/api/club-alan',
  clienteDemoId: 5,
  securityEnabled: true,
};
