#!/usr/bin/env bash
set -euo pipefail
set +x
: "${SONAR_TOKEN:?Falta la credencial de análisis}"
args=(-Dsonar.qualitygate.wait=true -Dsonar.qualitygate.timeout=300)
case "${SONAR_BACKEND:-local}" in
  local)
    export SONAR_HOST_URL=http://sonarqube:9000
    args+=(-Dsonar.projectKey=taqueria-alan-acs)
    ;;
  cloud)
    export SONAR_HOST_URL=https://sonarcloud.io
    [[ "${SONAR_CLOUD_PROJECT:-}" =~ ^[A-Za-z0-9_.:-]+$ ]] || {
      echo 'Indica la clave exacta del proyecto Taquería Alan en SonarCloud' >&2
      exit 2
    }
    args+=(-Dsonar.organization=chernandezu "-Dsonar.projectKey=$SONAR_CLOUD_PROJECT")
    ;;
  *) echo 'Backend Sonar desconocido' >&2; exit 2 ;;
esac
mvn -B -ntp org.sonarsource.scanner.maven:sonar-maven-plugin:5.1.0.4751:sonar "${args[@]}"
