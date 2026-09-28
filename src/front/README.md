# Taqueria Alan - Frontend

Frontend en Angular (standalone components) para consumir dos microservicios del backend:

- **catalogo-service**: gestion de categorias y productos.
- **club-alan-service**: consulta de puntos, historial de movimientos y gestion de membresia
  del programa de lealtad Club Alan.

> **Fuera de alcance**: la acumulacion automatica de puntos y el pago con puntos ocurren
> dentro de `pedidos-service` y `pagos-service`, que llaman internamente a `club-alan-service`
> servidor a servidor cuando se completa un pedido o un pago. Ese flujo no se implementa aqui.
> Este frontend solo permite **consultar** puntos y movimientos, y **gestionar la membresia**
> (activar/cancelar).

## Requisitos

- Node.js 20+ y npm.
- Angular CLI (`npm install -g @angular/cli`, opcional; tambien se puede usar `npx ng`).
- Los microservicios `catalogo-service` y `club-alan-service` corriendo localmente (o
  accesibles) para que la app tenga datos reales que consumir.

## Como correr el proyecto localmente

```bash
cd src/front
npm install
ng serve
```

Abre `http://localhost:4200/`. La app recarga automaticamente al modificar el codigo.

## Como se conecta a los microservicios

Las URLs base de cada API viven en `src/environments/`:

- `environment.ts` (desarrollo, usado por `ng serve` y `ng build --configuration development`):

  ```ts
  export const environment = {
    production: false,
    catalogoApiUrl: 'http://localhost:8082/api/catalogo',
    clubAlanApiUrl: 'http://localhost:8085/api/club-alan',
  };
  ```

- `environment.prod.ts` (usado por `ng build` / `ng build --configuration production`, con el
  reemplazo configurado en `angular.json` -> `fileReplacements`). Apunta a los App Services de
  Azure; actualiza los nombres reales antes de desplegar:

  ```ts
  export const environment = {
    production: true,
    catalogoApiUrl: 'https://taqueria-catalogo-service.azurewebsites.net/api/catalogo',
    clubAlanApiUrl: 'https://taqueria-club-alan-service.azurewebsites.net/api/club-alan',
  };
  ```

Los servicios de cada feature (`CategoriaService`, `ProductoService`, `ClubAlanService`) leen
estas constantes y nunca hardcodean una URL directamente.

## Manejo de errores y notificaciones

Un interceptor HTTP (`core/interceptors/error.interceptor.ts`) captura cualquier error 4xx/5xx
de las llamadas a los microservicios y muestra un snackbar con el mensaje (usa el `message` que
devuelve el `GlobalExceptionHandler` del backend cuando esta disponible). Otro interceptor
(`core/interceptors/auth.interceptor.ts`) ya esta preparado para inyectar un header
`Authorization: Bearer <token>` en cuanto exista autenticacion; hoy no hace nada si no hay token
guardado.

## Estructura del proyecto

```
src/app/
├── core/                 Interceptors, modelos e infraestructura compartida (no de UI)
├── shared/                Componentes reutilizables (spinner, empty-state, confirm-dialog)
├── layout/main-layout/    Shell de la app: sidenav + toolbar + <router-outlet>
├── features/catalogo/     Categorias y productos (CRUD completo)
└── features/club-alan/    Puntos, movimientos y membresia (solo lectura + gestion de membresia)
```

Cada feature se carga de forma perezosa (`loadChildren`) desde `app.routes.ts`.

## Pruebas unitarias

```bash
ng test
```

Ejecuta las pruebas con Vitest.
