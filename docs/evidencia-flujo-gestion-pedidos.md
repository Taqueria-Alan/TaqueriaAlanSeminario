# Evidencia técnica: flujo funcional de gestión de pedidos

## Alcance del prototipo

El prototipo conecta la vista Angular de cliente con `pedidos-service` (puerto
`8083`), `pagos-service` (puerto `8084`) y Club Alan (puerto `8085`). El
catálogo es la fuente de verdad de productos y precios; el navegador nunca
decide el total de una orden.

Para desarrollo local no se construye `auth-service` en esta rama. El servicio
de pedidos queda preparado para JWT mediante `SECURITY_ENABLED`; el perfil
local lo desactiva y usa el puente explícito `clienteDemoId: 5` de Angular. Al
integrar autenticación, ese valor se reemplaza por el cliente derivado del JWT,
sin cambiar el flujo de pedido ni pago.

La rama entrega adicionalmente el estado terminal `CANCELADO`. Es una extensión
necesaria para conservar la auditoría de una cancelación solicitada por el
cliente antes de pagar; no sustituye los estados operativos acordados:
`RECIBIDO`, `EN_PREPARACION`, `EN_RUTA` y `ENTREGADO`.

## Ruta demostrable de éxito

1. El cliente crea un pedido para llevar o a domicilio desde **Pedir**. Angular
   envía solamente identificadores de producto, cantidades y observaciones.
2. `pedidos-service` verifica cliente, disponibilidad y precios en `PRODUCTO`,
   calcula los subtotales y el total en el servidor y persiste `RECIBIDO`.
3. El cliente abre la pantalla intermedia **Pago**, ingresa una tarjeta de
   sandbox válida (`4242 4242 4242 4242`) y confirma.
4. `pagos-service` registra el pago `APROBADO` con una clave de idempotencia;
   no guarda PAN, CVV ni datos reales de tarjeta. El pedido normal pasa a
   `EN_PREPARACION`.
5. El administrador avanza con `POST /api/pedidos/{id}/avanzar`:
   - `LLEVAR`: `EN_PREPARACION` -> `ENTREGADO`.
   - `DOMICILIO`: `EN_PREPARACION` -> `EN_RUTA` -> `ENTREGADO`.
6. Si el pedido corresponde a una suscripción, el pago lo deja en `ENTREGADO`
   y activa Club Alan. Los pedidos posteriores de un miembro acumulan
   `floor(total / 10)` puntos una sola vez por pedido.

## Casos de rechazo y cambio solicitados

| Escenario | Acción de demostración | Resultado verificable |
| --- | --- | --- |
| Tarjeta inválida | Introducir `1234` en la pantalla de pago | HTTP 422, `TARJETA_INVALIDA`, el pedido continúa `RECIBIDO` y no hay cobro. |
| Fondos insuficientes | Usar la tarjeta sandbox `4000 0000 0000 0002` | HTTP 422, `FONDOS_INSUFICIENTES`, el pedido continúa editable y sin cobro. |
| Cliente cambia pedido | Desde Pago seleccionar **Editar**, cambiar cantidad o modalidad y guardar | HTTP 200, total recalculado por backend, todavía `RECIBIDO`. |
| Cliente cancela | Desde Pago seleccionar **Cancelar** antes de un pago aprobado | HTTP 200, estado terminal `CANCELADO`, sin cobro. |
| Reintento técnico | Enviar dos veces la misma `Idempotency-Key` | Mismo `idPago`, `idempotente: true`; no se duplica el cargo ni los puntos. |
| Clave usada en otra orden | Usar la misma `Idempotency-Key` al pagar un segundo pedido | Se crea un pago distinto del segundo pedido; no se puede reutilizar un pago ajeno. |
| Cambio tardío | Intentar editar o cancelar tras un pago aprobado | HTTP 422, `PEDIDO_PAGADO`. |
| Suscripción alterada | Marcar un taco u otro producto común como `SUSCRIPCION` | HTTP 400, `SUSCRIPCION_INVALIDA`; únicamente el SKU oficial de membresía activa Club Alan. |

> Las tarjetas indicadas son valores de simulación exclusiva. Nunca se deben
> capturar, registrar ni sustituir por una tarjeta real.

## Registros esperados para la evidencia

Los servicios escriben mensajes estructurados sin información de tarjeta. Para
una ruta exitosa, el identificador transversal es `pedidoId`; el
`correlationId` identifica la solicitud HTTP individual (por ejemplo,
`pytest-pedidos-...`) sin revelar datos sensibles:

```text
event=pedido.creado correlationId=... pedidoId=123 clienteId=5 estado=RECIBIDO modalidad=LLEVAR total=45.00
event=pago.aprobado correlationId=... pedidoId=123 pagoId=88 monto=45.00 pedidoEstado=EN_PREPARACION
event=pedido.avanzado correlationId=... pedidoId=123 estadoAntes=EN_PREPARACION estadoDespues=ENTREGADO
```

Para los casos no exitosos y de modificación, la evidencia esperada es:

```text
event=pago.rechazado correlationId=... pedidoId=124 codigo=TARJETA_INVALIDA
event=pago.rechazado correlationId=... pedidoId=125 codigo=FONDOS_INSUFICIENTES
event=pedido.actualizado correlationId=... pedidoId=126 clienteId=5 total=67.50
event=pedido.cancelado correlationId=... pedidoId=127 clienteId=5 motivoPresente=true
event=pago.idempotente correlationId=... pedidoId=123 pagoId=88 estado=APROBADO
event=club.activado pedidoId=128 clienteId=5
event=puntos.acumulados pedidoId=129 clienteId=5 puntos=4
```

Los valores numéricos cambian en cada ejecución. Las líneas anteriores son el
formato esperado, no una transcripción de datos productivos.

## Comandos de reproducción y captura

Con Docker Desktop en estado **Engine running**, desde la raíz del repositorio:

```powershell
# En equipos con memoria limitada, evita compilar los cinco servicios Java en paralelo.
$env:COMPOSE_PARALLEL_LIMIT = '1'
docker compose -f docker/docker-compose.yml build
docker compose -f docker/docker-compose.yml up -d
docker compose -f docker/docker-compose.yml ps
docker compose -f docker/docker-compose.yml logs --tail 120 pedidos-service pagos-service club-alan-service
```

Para la interfaz, en otra terminal:

```powershell
Set-Location src/front
npm start
```

Abrir `http://localhost:4200`, crear un pedido y tomar capturas de estas
pantallas, en este orden: carrito, pago, confirmación, seguimiento del pedido y
panel de administración. Para capturar una ruta de error, repetir desde la
pantalla de pago con cada valor de sandbox de la tabla anterior.

Para ejecutar la evidencia automatizada en el mismo entorno:

```powershell
$env:AUTH_URL = 'http://localhost:8081'
$env:CATALOGO_URL = 'http://localhost:8082'
$env:PEDIDOS_URL = 'http://localhost:8083'
$env:PAGOS_URL = 'http://localhost:8084'
$env:CLUB_URL = 'http://localhost:8085'
.\.venv\Scripts\python.exe -m pytest tests/ --junitxml=reports/pytest.xml --html=reports/report.html --self-contained-html
```

Si el staging local ya ocupa los puertos `8081` a `8085`, el mismo despliegue
puede levantarse de forma aislada con el proyecto
`taqueria-pedidos-verify` y los puertos `18081` a `18085`; así se evita
interrumpir Jenkins o staging durante la demostración.

El resultado verificado es `28 passed` y se generan `reports/pytest.xml` y
`reports/report.html`. Jenkins ejecuta estos mismos archivos con puertos
efímeros, publica el XML como JUnit y el HTML como **Pytest HTML**.

## Resultado de las verificaciones de esta rama

| Verificación | Resultado | Evidencia |
| --- | --- | --- |
| Compilación de Angular | Aprobada | `npm run build` finalizó correctamente y generó `dist/front`. |
| Descubrimiento de pruebas | Aprobado | `pytest --collect-only` encontró 28 pruebas: 15 smoke y 13 de flujo API. |
| Formato de cambios | Aprobado | `git diff --check` no reportó errores de espacios. |
| Migración sobre base local existente | Aprobada | El contenedor `db-migrations` espera la disponibilidad TCP de MySQL y ejecuta `04-pedidos-pagos.sql`; la migración consulta `information_schema` antes de agregar columnas o índices. |
| Motor Docker Desktop | Recuperado | Se actualizó Docker Desktop y se realizó un reinicio controlado del motor, sin restablecer valores de fábrica ni eliminar volúmenes. El engine respondió como `29.8.2` y Jenkins, staging y el entorno aislado volvieron a levantar. |
| Ejecución Docker de integración | Aprobada | Con los servicios reales en el proyecto aislado, `pytest` ejecutó 28 pruebas; `pytest.xml` registra `tests=28`, `failures=0` y `errors=0`. |
| Reportes de pruebas | Aprobados | Se generaron `reports/pytest.xml` (JUnit) y `reports/report.html` (Pytest HTML) tras la ejecución integrada. |

La ejecución integrada cubrió creación de orden, recálculo de total en backend,
tarjeta inválida, fondos insuficientes, edición y cancelación antes del pago,
idempotencia por pedido, entrega para llevar y domicilio, Club Alan y la
protección que impide sustituir el SKU de membresía por un producto ordinario.

## Corrección de infraestructura CI: ejecución Jenkins #9

La ejecución `#9` construyó correctamente las imágenes de los cinco servicios,
pero se detuvo antes de Pytest porque `db-migrations` finalizó con código `1`.
La causa no fue una credencial ni una sentencia SQL: Jenkins corre dentro de
un contenedor y su espacio de trabajo es un volumen Docker. Por ello, un bind
mount como `./mysql-init:/docker-entrypoint-initdb.d` no era visible para el
daemon Docker anfitrión; el archivo SQL llegaba como directorio y el cliente
MySQL no podía leerlo.

La corrección empaqueta los scripts de bootstrap `01` a `03` y la migración
`04` en imágenes Docker propias. El build de Docker transfiere su contexto al
daemon de forma segura, incluso cuando Jenkins usa Docker-outside-of-Docker.
La etapa **Build** construye también esas dos imágenes y la etapa **Test** las
usa con `--no-build`. Además, Test recrea `reports/` antes de empezar y publica
los logs de Compose antes de limpiar el entorno, evitando que un reporte HTML
de una ejecución previa se presente como evidencia actual.

Validación local posterior a la corrección: `db-migrations` terminó con código
`0`, se iniciaron MySQL, Redis y los cinco servicios reales, y Pytest reportó
`28 passed`, `0 failures` y `0 errors`.

## Límites declarados antes de producción

- En este alcance `codigoPedido` es una referencia pública derivada del ID
  persistido (`TAQ-00001`); no es un UUID almacenado en una columna adicional.
- El perfil Azure valida la firma del JWT, pero la asociación definitiva entre
  el `subject` del token, el `idCliente` y los roles queda para la rama de
  `auth-service`. No se debe activar ese perfil como autorización productiva
  hasta incorporar esa regla de propietario/rol.
- El puente local `clienteDemoId: 5` existe solo para que la demo funcione sin
  mezclar autenticación en esta rama. No se despliega como identidad de un
  usuario real.

## Qué incluir en el informe y video

1. Diagrama simple: Cliente Angular -> Pedidos -> Pagos -> Club Alan / MySQL.
2. Una captura de la ruta exitosa y una de cada rechazo de pago.
3. El reporte HTML de pytest y la consola Jenkins con sus etapas.
4. Extractos de logs con el mismo `pedidoId` y los `correlationId` de cada
   solicitud, ocultando cualquier variable de entorno y evitando incluir
   contraseñas o tokens.
5. Una nota de alcance: el despliegue de staging se activa solamente al llevar
   esta rama a `QA`; esta rama de trabajo no despliega producción.
