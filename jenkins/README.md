# Jenkins y Docker Desktop: Taquería Alan

Este repositorio tiene cuatro microservicios Maven (8081-8084), MySQL y Redis.
Jenkins utiliza 9090 y conserva su estado en el volumen `taqueria-jenkins_jenkins_home`.

## Arranque en Windows / PowerShell

1. Abre Docker Desktop y espera a que indique **Engine running**. Usa Linux containers.
2. En la raíz del repositorio ejecuta:

```powershell
.\jenkins\init-local-env.ps1
docker compose -f jenkins/compose.yml up -d --build
docker compose -f jenkins/compose.yml exec jenkins docker version
docker compose -f jenkins/compose.yml exec jenkins docker compose version
docker compose -f jenkins/compose.yml exec jenkins mvn -version
docker compose -f jenkins/compose.yml exec jenkins python3 --version
```

3. Abre http://localhost:9090 y usa la clave inicial:

```powershell
docker compose -f jenkins/compose.yml exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

La imagen de Jenkins instala Pipeline, Git, GitHub Branch Source, JUnit y HTML Publisher.
El puerto 9090 solo escucha en localhost. No publiques el puerto 50000 porque
este despliegue no usa agentes entrantes.
## Credenciales y job

En Manage Jenkins > Credentials crea dos **Secret text**:
- `taqueria-mysql-root`: valor de MYSQL_ROOT_PASSWORD en docker/.env.
- `taqueria-mysql-user`: valor de MYSQL_PASSWORD en docker/.env.

No pegues esos valores en el Jenkinsfile ni en el repositorio. Al usar un volumen
MySQL existente, conserva exactamente las contraseñas con que se inicializó.

Crea un Pipeline con Git para `MadelinRobles2/TaqueriaAlanSeminario`; script
path `Jenkinsfile`. Para un repositorio privado, registra una credencial de
GitHub de solo lectura y asígnala al SCM del job.

## Flujo de ramas y responsabilidades

- `dev`: los colaboradores implementan cambios y reciben integración continua.
- `QA`: rama de validación; después de Build y Test aprobados, el Jenkinsfile
  despliega al entorno de staging.
- `main`: queda reservada para la administradora del repositorio y la
  implementación a producción. El colaborador no modifica ni despliega esta
  rama desde Jenkins.

El usuario `ChernandezU` opera como colaborador técnico de `dev` y `QA`; no
necesita ni solicita privilegios de administración del repositorio. Para el
clonado del repositorio privado se utiliza un token personal de la cuenta del
colaborador con acceso de lectura al repositorio; no se almacena en Git.

Para recibir webhooks desde GitHub, publica Jenkins mediante una URL HTTPS
alcanzable y configura `https://TU_URL/github-webhook/`. La URL local
http://localhost:9090 no es accesible desde GitHub.

## Aplicación local

```powershell
docker compose --env-file docker/.env -p taqueria-staging -f docker/docker-compose.yml up -d --build
docker compose --env-file docker/.env -p taqueria-staging -f docker/docker-compose.yml ps
```

No ejecutes `down --volumes` en staging: eliminaría datos de MySQL.
El perfil `local` desactiva TLS solo para MySQL y Redis de este Compose local.

## Pruebas de humo

La etapa **Test** ejecuta las 15 pruebas de `tests/test_suite.py` y publica los
reportes `reports/pytest.xml` y `reports/report.html`. La suite lee `AUTH_URL`,
`CATALOGO_URL`, `PEDIDOS_URL` y `PAGOS_URL`, comprueba la respuesta HTTP de
cada microservicio y la carga con Chromium Headless. Las respuestas 401, 403 y
404 son válidas para una prueba de disponibilidad: confirman que el servicio
respondió; errores 5xx o de conexión fallan el pipeline. La imagen Jenkins ya
incluye Chromium y ChromeDriver.
