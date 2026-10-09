# Taquería Alan — Plataforma Digital & Club Alan

Repositorio del proyecto **Transformación Digital de Taquería Alan**: marketplace propio de pedidos en línea y programa de membresía ("Club Alan") para reducir la dependencia de comisiones de plataformas de delivery de terceros.

Proyecto Spring Boot organizado en microservicios (**auth**, **catalogo**,
**pedidos**, **pagos**, **club-alan**), con MySQL y Redis como infraestructura compartida,
mas un frontend Angular en `src/front`.

Universidad Mariano Gálvez de Guatemala — Seminario.

## Equipo (Scrum)

| Nombre                              | Rol Scrum     | Carnet          |
|--------------------------------------|---------------|-----------------|
| Cristian Alejandro Hernández Ordoñez | Product Owner | 0900-22-1826    |
| Rolando Danilo López Mauricio        | Scrum Master  | 0900-16-10596   |
| Madelin Juliana Robles Hernández     | Developer     | 0900-22-5518    |


## Estructura

```
.
├── src/                    # Modulos Maven, uno por microservicio
│   ├── auth-service/
│   ├── catalogo-service/
│   ├── pedidos-service/
│   ├── pagos-service/
│   ├── club-alan-service/
│   └── front/              # Frontend Angular
├── docker/                 # Dockerfiles por microservicio + docker-compose
│   ├── auth/Dockerfile
│   ├── catalogo/Dockerfile
│   ├── pedidos/Dockerfile
│   ├── pagos/Dockerfile
│   ├── club-alan/Dockerfile
│   └── docker-compose.yml
├── docs/                   # Documentacion (arquitectura, API, datos)
└── tests/                  # Pruebas de integracion y end-to-end
```

Cada microservicio (`src/<servicio>-service`) sigue el layout estandar de
Maven: `src/main/java`, `src/main/resources`, `src/test/java`, con paquetes
`controller`, `service`, `repository`, `model`, `dto`, `config`, `exception`.

## Infraestructura (Docker)

- **MySQL 8** — una unica base de datos compartida por los microservicios.
- **Redis 7** — cache compartida.

## Como levantar el entorno

```bash
cd docker
cp .env.example .env
docker compose up --build
```

| Servicio          | Puerto |
|--------------------|--------|
| auth-service       | 8081   |
| catalogo-service   | 8082   |
| pedidos-service    | 8083   |
| pagos-service      | 8084   |
| club-alan-service  | 8085   |
| MySQL              | 3306   |
| Redis              | 6379   |

## Documentacion

Ver [docs/README.md](docs/README.md).
