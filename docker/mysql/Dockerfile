FROM mysql:8.0

# MySQL ejecuta estos archivos en orden al crear un volumen de datos vacío.
# Se copian a la imagen para que Jenkins no dependa de bind mounts desde su
# workspace interno hacia el daemon Docker del host.
COPY mysql-init/01-schema.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY mysql-init/02-catalogos-base.sql /docker-entrypoint-initdb.d/02-catalogos-base.sql
COPY mysql-init/03-datos-demo.sql /docker-entrypoint-initdb.d/03-datos-demo.sql
