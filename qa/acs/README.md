# Evidencia de Fase 2 — Taquería Alan

Rama aislada `acs/fase2-evidencias` basada en `019b6ce`. No modifica main, QA ni Azure.

- **E9:** dev, QA y main visibles; PR #1 aprobado sin comentario de revisión visible. No acreditar 3 revisiones ni protección sin evidencia adicional. Promoción propuesta: PR de dev a QA, luego QA a main, con checks obligatorios en las ramas de destino.
- **E10:** 14 pruebas nuevas Vitest ejecutadas con Docker. Maven reportó 16 en el build histórico documentado. Los casos de membresía aíslan MySQL con Mockito. Falta corrida conjunta y la comparación con línea base registrada y módulos E2.
- **E11:** la colección versionada se ejecutó en Azure demo con Newman desde Docker: 16 solicitudes, 47 aserciones, 0 fallos. Solo creó una cuenta sintética y un pedido marcado como prueba con pago simulado. El Jenkinsfile QA prepara Newman en su gateway temporal después de Pytest; esa ejecución aún no fue validada en Jenkins.
- **E12:** SonarQube respondió UP. Pendientes proyecto y credencial de análisis, línea base y comparativa, y gate con resultado trazable. El servicio activo por sí mismo no acredita E12.
- **E13:** el Jenkinsfile Azure histórico ejecuta Maven y verificación Azure. Para completar la rúbrica falta la secuencia única compilación, unitarias, Sonar con gate, API sobre candidato y despliegue. No se simuló una corrida completa.
- **E14:** `resultado-carga-20261106.json` documenta 1 min de rampa, 5 min a 50 VU y 30 s de descenso en Azure. Los tiempos de espera se contabilizaron desde el log porque 50 solicitudes interrumpidas quedaron fuera del contador de validación. La conclusión de cumplimiento necesita los umbrales E1.

## Repetir

- Frontend: `docker build --progress=plain -f jenkins/Frontend.Dockerfile -t taqueria-acs-frontend-qa .`
- Newman: el runner de CI apunta únicamente al gateway desechable de Docker Compose. No uses el parámetro de escritura en un ambiente con datos reales.
- k6: `Get-Content -Raw qa/acs/catalogo.k6.js | docker run --rm -i grafana/k6 run --quiet -`. Ejecutar solo durante una ventana de prueba autorizada. La métrica personalizada debe cotejarse con los timeouts del log. Rutas: productos y categorías.

Referencias: enunciado ACS §§2.4, 4.2 y 5; documentación oficial de k6: https://grafana.com/docs/k6/latest/get-started/running-k6/.
