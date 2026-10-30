# Jenkins → Azure: pendiente de aplicar por accesos

## Estado inicial de la entrega, antes de reconectar el equipo

- URL: https://ta-alan-2665-gateway.azurewebsites.net/
- Suscripción: 2665af54-7e11-4031-ae76-1ebe75e1a326.
- Grupo: rg-taqueria-presentacion.
- Apps existentes: ta-alan-2665-auth, catalogo, pedidos, pagos, club-alan, gateway.
- GitHub devuelve 403 Resource not accessible by integration al crear una rama.
- Desktop Commander muestra el dispositivo CRISTIAN desconectado.
- No se modificó el Jenkins local ni se publicó esta configuración en GitHub.

## Archivos

- Jenkinsfile.azure: job dedicado que comprueba main, compila, publica y verifica.
- jenkins/Frontend.Dockerfile: Angular con Node 24.
- scripts/azure/package-frontend.sh: empaqueta Angular dentro del gateway.
- scripts/azure/run-deploy-container.sh: Azure CLI en contenedor temporal.
- scripts/azure/deploy-existing.py: publica solo JARs en los seis App Service.
- scripts/azure/verify-readonly.py: consulta seis rutas y guarda reports/azure-verify.json.
- SpaController y environment.prod.ts mantienen frontend y APIs en el mismo origen.
- Jenkinsfile existente: agrega gateway-service a la construcción Docker que faltaba.

El pipeline no crea recursos Azure, no inicializa MySQL y no reescribe variables
ni contraseñas de las aplicaciones. Una publicación es secuencial: si falla a
mitad, algunos servicios pueden quedar actualizados. No hay rollback automático.

## Credencial exacta en Jenkins

Crear una carpeta de Jenkins exclusiva para despliegues confiables. Allí registrar:

- Kind: Secret file.
- ID: azure-taqueria-sp.
- Archivo JSON, preparado fuera de Git y sin pegar secretos en el chat:

```json
{
  "clientId": "ID_DE_LA_APLICACION_ENTRA",
  "clientSecret": "SECRETO_DE_LA_IDENTIDAD_DE_DESPLIEGUE",
  "tenantId": "5f53b4ce-63d4-4ee8-88d2-22f0b2d4b27a",
  "subscriptionId": "2665af54-7e11-4031-ae76-1ebe75e1a326"
}
```

Esta identidad de servicio todavía NO está creada ni autorizada. Un administrador
debe prepararla con permisos de publicación limitados al grupo del proyecto.
No usar la contraseña personal de Azure, el administrador de la web ni la clave
MySQL para esta credencial. No colocar el JSON en el repositorio o workspace.
Conservar el archivo original en almacenamiento privado apropiado.

## Job dedicado

1. Reintegrar los cambios en main mediante una revisión de código.
2. New Item → Pipeline → nombre Taqueria-Azure, dentro de la carpeta confiable.
3. Pipeline script from SCM → Git → repositorio Taqueria-Alan/TaqueriaAlanSeminario.
4. Branch Specifier: */main. Script Path: Jenkinsfile.azure.
5. No usar este job para PR ni ramas de colaboradores sin revisar.
6. Requiere el agente existente con Java 21, Maven, Python 3 y Docker CLI.
   Docker descarga node:24-bookworm-slim y mcr.microsoft.com/azure-cli:azurelinux3.0.
7. Habilitar el disparador GitHub cuando exista conectividad del webhook al job.
8. Ejecutar una compilación manual y comprobar las cuatro etapas antes de activar
   despliegues por push. Ese primer build sigue pendiente.

Proteger main y restringir quién puede editar el job o utilizar sus credenciales.
No compartir el agente de despliegue con jobs no confiables: acceso al socket
Docker implica capacidad de administrar los contenedores del mismo motor.
No se requiere reconstruir el controlador Jenkins solo para instalar Node/Azure CLI.

## Cómo aplicar el parche local

Desde PowerShell, en C:\Users\crist\jenkins\TaqueriaAlanSeminario:

```powershell
git status --short
git switch -c deploy/azure-presentation
git apply --check C:\RUTA\Taqueria_Jenkins_Azure.patch
git apply C:\RUTA\Taqueria_Jenkins_Azure.patch
git diff --stat
```

El parche parte de main 74810ee20a052215e2c1a3c02856746cab1717e5.
Si ya aplicaste cambios de la entrega anterior, no fuerces el parche: revisar
las diferencias y conservar esos cambios antes de integrar esta continuación.

## Validación de esta entrega

- Sintaxis de los scripts Bash y Python comprobada.
- Se comprueba suscripción y los seis artefactos antes de iniciar sesión en Azure.
- Se rechaza un gateway sin Angular dentro del JAR.
- El pipeline completo no se ejecutó: Docker/Jenkins local no está accesible.
- Seis comprobaciones HTTP actuales aprobadas; el resultado se incluye en reports/azure-verify.json en el ZIP.

Referencias oficiales:
https://learn.microsoft.com/cli/azure/run-azure-cli-docker
https://www.jenkins.io/doc/pipeline/steps/credentials-binding/

## Continuacion desde la computadora CRISTIAN

Se reconecto Desktop Commander y se inicio Docker Desktop. Se aplico el parche
en un worktree separado: C:\Users\crist\jenkins\TaqueriaAlanAzure, rama
`deploy/azure-presentation`, conservando la rama QA del directorio original.
La prueba `git push --dry-run` con las credenciales Git de la computadora paso.

El parametro DEPLOY_AZURE es falso por defecto. Permite probar compilacion y
consultas HTTP sin la identidad Azure ni publicaciones sobre la app activa.
Al activarlo, se comprueba que HEAD coincida con origin/main antes de cargar
la credencial. Para la primera validacion puede usarse la rama de preparacion;
para publicar, integrar la revision y configurar el job desde main.

`jenkins/create-azure-job.groovy` crea el job Taqueria-Azure-Preparacion si no
existe. No cambia autenticacion ni permisos. Su aplicacion y el primer build
deben verificarse en la instancia Jenkins local.
