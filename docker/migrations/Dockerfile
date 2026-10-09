FROM mysql:8.0

# 04 se aplica explícitamente por db-migrations después del healthcheck de
# MySQL. Al estar dentro de la imagen, funciona desde Docker Desktop y CI.
COPY mysql-init/04-pedidos-pagos.sql /migrations/04-pedidos-pagos.sql
