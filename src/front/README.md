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
├── features/landing/      Sitio publico
├── features/auth/         Login y registro
├── features/cliente/      Panel del cliente (inicio y hacer pedido)
├── features/admin-*/      Resumen, pedidos, clientes, reportes y ajustes del admin
├── features/catalogo/     Categorias y productos (CRUD completo)
└── features/club-alan/    Puntos, movimientos y membresia (solo lectura + gestion de membresia)
```

Cada feature se carga de forma perezosa (`loadChildren`) desde `app.routes.ts`.

## Acceso, panel de cliente y pedidos (simulados)

`auth-service`, `pedidos-service` y `pagos-service` aun no exponen endpoints, asi que el
frontend trae una **capa simulada** guardada en `localStorage` para poder usar el flujo completo:

| Ruta | Quien entra | Descripcion |
| --- | --- | --- |
| `/` | Todos | Landing publica con el menu |
| `/login`, `/registro` | Invitados | Acceso y alta de cliente |
| `/cliente`, `/cliente/pedir` | Rol `CLIENTE` | Pedido activo, historial y armado de pedido |
| `/admin/resumen` | Rol `ADMIN` | KPIs del dia, ventas por hora, mas vendidos y tablero de pedidos en vivo |
| `/admin/pedidos` | Rol `ADMIN` | Lista filtrable por estado, periodo y busqueda; detalle y avance de cada pedido (simulado) |
| `/admin/catalogo/productos`, `/admin/catalogo/categorias` | Rol `ADMIN` | Menu y categorias contra catalogo-service (real) |
| `/admin/clientes` | Rol `ADMIN` | Ficha de cliente con puntos, membresia y ultimos movimientos desde club-alan-service (real) |
| `/admin/club-alan/{puntos,movimientos,membresia}` | Rol `ADMIN` | Pantallas de Club Alan contra club-alan-service (real); se enlazan entre si conservando el cliente elegido |
| `/admin/reportes` | Rol `ADMIN` | Ventas por hora o dia, productos con mas ingresos, tipo de pedido y exportacion CSV (simulado) |
| `/admin/ajustes` | Rol `ADMIN` | Datos del negocio (se reflejan en la landing) e interruptores de pedidos en linea y domicilio (simulado) |

- **Cuenta de personal de prueba**: `admin@taqueriaalan.com` / `Admin1234` (definida en
  `core/auth/auth.service.ts`, solo para demo). Los clientes se crean desde `/registro`.
- `core/auth/auth.service.ts` y `core/pedidos/pedido.service.ts` exponen `Observable`s con la
  forma de la futura API. Cuando existan los endpoints, sustituye el cuerpo de `login`,
  `registrar`, `crear` y `avanzar` por llamadas `HttpClient` y agrega las URLs a `environment`.
- Estados del pedido: `RECIBIDO`, `EN_PREPARACION`, `EN_RUTA`, `ENTREGADO` (definidos en `core/pedidos/pedido.model.ts`). `EN_RUTA` solo aplica a pedidos a domicilio; los de para llevar pasan de `EN_PREPARACION` a `ENTREGADO`.
- Suscripcion al Club Alan: es un pedido de clase `SUSCRIPCION` (`PEDIDO.id_tipo_pedido`) cuyo producto es un producto de servicio del catalogo. El front toma ese producto de la categoria `Servicios` (el que se llame "Club Alan" o "Membresia", o el primero); si no existe, no ofrece la suscripcion. Su flujo es `RECIBIDO` -> `ENTREGADO` y al entregarse el cliente pasa a ser miembro (en el backend real lo haria pedidos-service llamando a club-alan-service). La modalidad (`LLEVAR`/`DOMICILIO`) corresponde a `PEDIDO.modalidad`.
- El menu del cliente (`features/cliente/services/menu.service.ts`) lee los productos
  disponibles de `catalogo-service`; si no responde o esta vacio usa `core/data/menu.data.ts`.
- Si cambias el nombre de la clave de sesion, recuerda que `auth.interceptor.ts` lee el token de
  `taqueria_auth_token`: la sesion simulada no lo escribe a proposito.
- Los pedidos de ejemplo (una semana de historial y los de hoy) se siembran solos; en Ajustes puedes restablecerlos.
- Los datos del negocio y los interruptores de Ajustes viven en `core/config/configuracion.service.ts` (localStorage) hasta que haya un servicio de configuracion.
- Paleta y componentes de marca (`.alan-btn`, `.alan-field`, `.alan-emblem`, `--alan-*`) viven en
  `src/styles.scss`; el tema de Angular Material se alinea con esa paleta en el mismo archivo.

## Pruebas unitarias

```bash
ng test
```

Ejecuta las pruebas con Vitest.
