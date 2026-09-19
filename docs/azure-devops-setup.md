# Configuracion de Azure DevOps

Guia para configurar Azure Boards, Azure Repos (conectado a GitHub),
Azure Pipelines y Azure Test Plans para este proyecto.

## 1. Organizacion y proyecto

1. Crear una organizacion en https://dev.azure.com (una cuenta Microsoft/GitHub
   sirve para autenticarse).
2. Crear un proyecto nuevo, por ejemplo `TaqueriaAlanSeminario`.
3. En **Project settings > Process**, seleccionar el proceso **Scrum**
   (encaja con los roles Product Owner / Scrum Master / Developer del equipo).

## 2. Azure Repos conectado a GitHub

El codigo permanece en GitHub (`MadelinRobles2/TaqueriaAlanSeminario`); no se
migra a Azure Repos. Se conecta Azure Boards/Pipelines a ese repositorio:

1. Instalar la app **Azure Boards** desde el GitHub Marketplace en el
   repositorio (https://github.com/marketplace/azure-boards).
2. En Azure DevOps: **Project settings > GitHub connections > Connect your
   GitHub account**, autorizar y seleccionar el repositorio.
3. A partir de ahi, cualquier commit o pull request en GitHub que mencione
   `AB#<numero-de-work-item>` (por ejemplo `AB#12`) se vincula automaticamente
   al work item correspondiente en Azure Boards.

## 3. Azure Boards: Epics, Features, User Stories

Estructura sugerida (proceso Scrum -> tipos: Epic, Feature, Product Backlog Item):

- **Epic: Plataforma Digital Taqueria Alan**
  - **Feature: Autenticacion y usuarios** (auth-service)
    - User Story: Registro de cliente
    - User Story: Login con email y contrasena
    - User Story: Roles (cliente / administrador)
  - **Feature: Catalogo de productos** (catalogo-service)
    - User Story: Listar productos disponibles
    - User Story: Administrar productos (alta/baja/edicion)
  - **Feature: Gestion de pedidos** (pedidos-service)
    - User Story: Crear un pedido
    - User Story: Consultar estado de un pedido
  - **Feature: Pagos** (pagos-service)
    - User Story: Procesar pago de un pedido
    - User Story: Consultar historial de pagos
- **Epic: Club Alan (membresia)**
  - Features y user stories segun se definan.

Pasos en el portal:

1. **Boards > Backlogs**, crear los Epics.
2. Abrir cada Epic y agregar Features como hijos.
3. Abrir cada Feature y agregar User Stories (Product Backlog Items) como hijos.
4. Usar **Area Path** por microservicio (Auth, Catalogo, Pedidos, Pagos) para
   poder filtrar el backlog y los sprints por componente.
5. Configurar **Iterations** (sprints) en **Project settings > Iterations**.

## 4. Azure Pipelines (build + test)

Ya existe [azure-pipelines.yml](../azure-pipelines.yml) en la raiz del
repositorio: compila con Maven (JDK 21) y ejecuta las pruebas de los 4
modulos (`mvn clean verify`), publicando los resultados JUnit.

Para activarlo:

1. **Pipelines > Create Pipeline**.
2. Elegir **GitHub** como origen y autorizar el acceso al repositorio
   `MadelinRobles2/TaqueriaAlanSeminario`.
3. Azure detecta el archivo `azure-pipelines.yml` existente en la raiz —
   seleccionar **Existing Azure Pipelines YAML file**.
4. Guardar y ejecutar. El pipeline correra automaticamente en cada push o
   pull request contra `main` (definido en el `trigger`/`pr` del YAML).

## 5. Plan de pruebas inicial

El hub **Azure Test Plans** (organizar planes/suites, ejecutor de pruebas
manuales, reportes de cobertura) es una extension de pago por usuario, sin
capa gratuita permanente. Para este proyecto se usa la alternativa sin costo:
work items de tipo **Test Case**, que si estan incluidos en el acceso Basic
(gratuito) de Azure DevOps.

### Opcion recomendada (gratis): Test Case como work item

1. **Boards > Backlogs** (o **Queries > New query**) **> New work item >
   Test Case**.
2. Escribir los pasos de prueba y el resultado esperado en el campo
   **Description** (no se tiene la grilla de "Steps" de Test Plans, pero el
   texto libre documenta igual el caso).
3. Enlazar cada Test Case a su User Story correspondiente con el link
   **Tests / Tested By** (Add link > Tests) para mantener trazabilidad.
4. Casos iniciales sugeridos:
   - Auth: login exitoso, login con credenciales invalidas, registro duplicado.
   - Catalogo: listar productos, crear producto como admin.
   - Pedidos: crear pedido valido, crear pedido con producto inexistente.
   - Pagos: pago exitoso, pago rechazado.
5. Estos casos manuales complementan las pruebas automatizadas que iran en
   `/tests` (integracion/e2e) y en `src/<servicio>/src/test` (unitarias).

### Opcion alterna (si hay licencia o trial de Test Plans)

Si el equipo cuenta con licencia **Basic + Test Plans** (de pago) o un
trial activo, se puede usar el hub completo:

1. **Test Plans > New Test Plan**, nombrarlo "Plan de pruebas inicial".
2. Crear una **Test Suite** por microservicio (Auth, Catalogo, Pedidos, Pagos),
   idealmente vinculada como *requirement-based suite* a cada Feature de
   Boards, para que la cobertura quede trazable.
3. Agregar los mismos Test Cases del listado anterior dentro de cada suite,
   ahora con el editor de pasos y el Test Runner disponibles.
