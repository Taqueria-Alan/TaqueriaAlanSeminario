export const environment = {
  production: true,
  // Todo pasa por el gateway: una sola cookie de sesion para los 5 servicios,
  // sin importar que cada uno viva en su propio subdominio de azurewebsites.net.
  authApiUrl: '/api/auth',
  catalogoApiUrl: '/api/catalogo',
  pedidosApiUrl: '/api/pedidos',
  pagosApiUrl: '/api/pagos',
  clubAlanApiUrl: '/api/club-alan',
  clienteDemoId: 5,
  securityEnabled: true,
};
