# Cierre de auditoría ACS — Taquería Alan

## E9: promoción y bloqueo

- `dev`: integrar funcionalidades por pull request y ejecutar CI.
- `QA`: promover el candidato revisado desde dev. Exigir el check de CI sobre el SHA del candidato. Bloquear push directo y merges con check pendiente o fallido.
- `main`: promover la revisión probada en QA por PR. Exigir el check de CI sobre el SHA de promoción y conservar el SHA liberado para rastrear el despliegue.
- Evidencia requerida: tres PR reales con revisión técnica de otra persona, resultados del check y reglas activas en QA/main. Una aprobación sin contenido no demuestra revisión efectiva. Configurar los checks cuando Jenkins ya publique un contexto estable en GitHub, y verificar con un PR de prueba que un fallo bloquea el merge.

## E10: unidad y cobertura

`qa/acs/pipeline-unit.sh` ejecuta Maven con JaCoCo, compila Angular y ejecuta Vitest en Docker. Cuenta pruebas aprobadas de ambos lados y falla si hay menos de 30 o si hay casos omitidos o fallidos. En Jenkins se publican los XML de JUnit y JaCoCo. Los dobles Mockito de membresía aíslan repositorios para probar activación, conflicto por membresía activa y cancelación sin membresía, sin MySQL.

Comparar los reportes JaCoCo con el mismo instrumento y los módulos Java realmente registrados en E2. Obtener dos árboles, desde el commit oficial de la línea base y el candidato. Ejecutar en cada árbol `mvn -B -ntp clean org.jacoco:jacoco-maven-plugin:0.8.13:prepare-agent verify org.jacoco:jacoco-maven-plugin:0.8.13:report`. Después:

    python3 qa/acs/comparar-cobertura.py /ruta/base /ruta/candidato src/modulo-critico

Sustituir el módulo ilustrativo por los registrados. El comparador falla con reportes ausentes, denominador cero o mejora menor a 20 pp; no interpreta un archivo ausente como 0%. Si E2 registra módulos Angular, generar también cobertura de frontend con la misma métrica de la línea base y reportarla aparte. No fijar una línea base nueva a posteriori.

## E12/E13: conexión Sonar y ejecución

El Jenkinsfile de esta rama incorpora el gate obligatorio antes de Newman. El proyecto esperado es `taqueria-alan-acs` en SonarQube local. Sonar se detuvo por OOM; Docker reportó aproximadamente 3.71 GiB de RAM asignada con otros servicios en ejecución. Resolver el presupuesto de memoria y comprobar `/api/system/status` antes de analizar. Conectar el agente Jenkins a la red de Sonar (`sonar-lab_sonarnet`). Registrar en el job de confianza una credencial Secret text `sonarqube-taqueria-acs` con un token de análisis de este proyecto. No usar credenciales del laboratorio ajeno ni imprimir tokens.

Analizar la revisión base y guardar fecha, SHA, quality gate, bugs, vulnerabilidades, code smells, duplicación y deuda técnica. Exportar los hallazgos Blocker/Critical; para cada uno registrar cambio y prueba, repetir el análisis y comparar. Si quedan condiciones fallidas, describir regla, causa, corrección, responsable y nueva verificación. La falta de credencial, un análisis fallido o un gate negativo impiden ejecutar API y despliegue. La rama de evidencias no publica en producción; verificar el despliegue correspondiente en QA cuando exista revisión autorizada y Sonar esté configurado.

## E14: conclusión

La corrida k6 del 6 de noviembre usó Azure y dos rutas de lectura del catálogo: productos y categorías. En productos hubo 50 timeouts de 6,689 solicitudes (0.75% observado), p95 366 ms y promedio 532 ms. Categorías: p95 251 ms y promedio 134 ms, sin timeouts registrados. El JSON adjunto contiene throughput y el perfil de 50 VU.

E1 de Fase 1 (documento «Fase 1 — Análisis, diseño y ejecución de pruebas»):

- **RNF-01 — No cumple.** El p95 debe ser menor a 200 ms en consultas de catálogo. Productos: 366.12 ms; categorías: 250.64 ms. Las dos rutas superaron el umbral.
- **RNF-02 — Dentro del límite en el escenario ejecutado.** La carga llegó a 50 VU y se sostuvo durante 5 minutos. Hubo 50 timeouts entre 13,328 solicitudes etiquetadas (0.38% observado), por debajo del 1%. El cálculo resume toda la corrida y no separa la meseta de la rampa. No demuestra el mismo resultado para otros flujos.

## E10: resultado medido

E2 identifica auth-service y pagos-service. El 6 de noviembre se ejecutó el script de etapa unitaria dentro del contenedor Jenkins, fuera del job: 34 pruebas Java y 14 Vitest, todas aprobadas. Dieciocho pruebas nuevas cubren autenticación y pagos, con repositorios, codificador, JWT y publicación de eventos aislados mediante Mockito.

Referencia reconstruida: 46f8be0882e1984e3ec3b3f2d6af9685e0a1c727, último commit de origin/main anterior al cierre de Fase 1. El árbol contiene los dos módulos y ninguna prueba Java en ellos. Se compiló esa revisión, se verificó que no había tests y se generaron reportes JaCoCo con datos de ejecución vacíos. No se encontró una etiqueta, reporte registrado o referencia en E2 que identifique oficialmente el SHA como línea base de la sección 2.4.

| Alcance | Referencia reconstruida | Candidato | Incremento |
| --- | ---: | ---: | ---: |
| auth-service | 0.00% | 43.16% | +43.16 pp |
| pagos-service | 0.00% | 45.58% | +45.58 pp |
| Total ponderado por líneas | 0.00% | 44.47% | +44.47 pp |

La comparación técnica supera +20 pp. La equivalencia con la línea base registrada queda sin acreditar. No se atribuye al pipeline completo la ejecución directa del script.

## E15/E16

El video debe mostrar una ejecución real del pipeline completo, resultados de Sonar y carga. Si la inscripción fue grupal, acreditar las defensas individuales de todos en el video único, salvo indicación docente distinta. La bitácora se entrega aparte; el titular valida la descripción de su aporte.
