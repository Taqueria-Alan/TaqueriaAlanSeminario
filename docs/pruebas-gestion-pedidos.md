# Matriz de pruebas: Gestión de pedidos y pagos

La suite se ejecuta con `python -m pytest tests/ --junitxml=reports/pytest.xml --html=reports/report.html --self-contained-html`.
No utiliza credenciales, tarjetas reales ni datos productivos. Los servicios se configuran por `PEDIDOS_URL`, `PAGOS_URL`, `CATALOGO_URL` y `CLUB_URL`; los valores predeterminados coinciden con los puertos efímeros de CI `18083` a `18085`.

| ID | Escenario | Resultado esperado |
| --- | --- | --- |
| PED-01 | Crear pedido con precio/total enviados por el navegador | El backend ignora los montos del cliente y calcula con el catálogo oficial. |
| PED-02 | Crear pedido sin líneas | HTTP 400 y código `VALIDACION`. |
| PED-03 | Cambiar un pedido recibido antes de pagarlo | HTTP 200, recálculo de total y estado `RECIBIDO`. |
| PED-04 | Cancelar un pedido recibido antes de pagarlo | HTTP 200 y estado terminal `CANCELADO`; no admite edición posterior. |
| PAG-01 | Número de prueba con formato inválido | HTTP 422 y código `TARJETA_INVALIDA`. |
| PAG-02 | Tarjeta de prueba sin fondos | HTTP 422 y código `FONDOS_INSUFICIENTES`. |
| PAG-03 | Pago de prueba aprobado | HTTP 201, pago `APROBADO` y pedido `EN_PREPARACION`. |
| PAG-04 | Reintento con la misma clave de idempotencia | Devuelve el mismo `idPago`, marcado como idempotente, sin doble cobro. |
| PAG-05 | Misma clave de idempotencia en otro pedido | Se procesa como un pago nuevo del segundo pedido; nunca reutiliza un pago ajeno. |
| PED-05 | Pedido para llevar ya pagado | `EN_PREPARACION` pasa a `ENTREGADO`; un avance adicional da HTTP 422. |
| PED-06 | Pedido a domicilio ya pagado | `EN_PREPARACION` pasa por `EN_RUTA` y termina en `ENTREGADO`. |
| PED-07 | Cancelación posterior a un pago aprobado | HTTP 422 y código `PEDIDO_PAGADO`. |
| CLUB-01 | Pagar una suscripción Club Alan | El pedido termina en `ENTREGADO` y la membresía del cliente queda activa. |
| CLUB-02 | Pagar un pedido normal de un miembro | Se registra una única acumulación de puntos para el ID de pedido. |
| CLUB-03 | Marcar un producto común como suscripción | HTTP 400 y código `SUSCRIPCION_INVALIDA`; solo el SKU oficial de membresía activa Club Alan. |
| CLUB-04 | Editar una suscripción válida antes de pagarla | HTTP 400 y código `SUSCRIPCION_INVALIDA` si se intenta reemplazar el SKU de membresía por un producto común. |
| SMK-01 a SMK-15 | Disponibilidad de Auth, Catálogo, Pedidos y Pagos | URL válida, respuesta HTTP sin 5xx, carga en Chromium Headless y puertos distintos. |

## Evidencia que se debe conservar

1. `reports/pytest.xml` y `reports/report.html` publicados por Jenkins.
2. El identificador de correlación `pytest-pedidos-...` de los logs de `pedidos-service` y `pagos-service`; permite relacionar una prueba con creación, pago, cancelación o avance sin registrar información sensible.
3. La consola de Jenkins con las 28 pruebas aprobadas y las etapas Checkout, Build, Test y Deploy Staging.

Los únicos PAN de demostración se declaran dentro de la suite para la simulación local: un número válido de sandbox, uno de formato inválido y uno que termina en `0002` para representar fondos insuficientes. Nunca se debe sustituirlos por una tarjeta real ni añadir CVV.
