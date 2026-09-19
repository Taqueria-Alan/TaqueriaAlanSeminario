# Arquitectura

## Vision general

Proyecto basado en microservicios con Spring Boot. Cada microservicio es
independiente y tiene su propio contenedor Docker, pero todos comparten la
misma base de datos MySQL (`taqueria_db`).

## Microservicios

| Servicio          | Puerto | Responsabilidad                  |
|--------------------|--------|------------------------------------|
| auth-service       | 8081   | Autenticacion y autorizacion      |
| catalogo-service   | 8082   | Gestion del catalogo de productos |
| pedidos-service    | 8083   | Gestion de pedidos                |
| pagos-service      | 8084   | Procesamiento de pagos            |

## Infraestructura compartida

- **MySQL**: servidor de base de datos, una unica base de datos (`taqueria_db`) compartida por todos los microservicios.
- **Redis**: cache compartida entre microservicios.

## Pendiente de definir

- Comunicacion entre microservicios (sincrona/asincrona).
- Estrategia de autenticacion entre servicios.
- Observabilidad (logs, metricas, trazas).
