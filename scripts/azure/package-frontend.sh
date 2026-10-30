#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p .azure-release/frontend .azure-release/jars
image="taqueria-frontend-build:${BUILD_NUMBER:-manual}"
container=""
cleanup() {
    if [ -n "$container" ]; then docker rm -f "$container" >/dev/null 2>&1 || true; fi
    docker image rm "$image" >/dev/null 2>&1 || true
}
trap cleanup EXIT
docker build -f jenkins/Frontend.Dockerfile -t "$image" .
container=$(docker create "$image")
# docker cp works when Jenkins itself is a container using the host Docker socket.
# Binding Jenkins' workspace as a host path would not work on Docker Desktop.
docker cp "$container:/build/dist/front/browser/." .azure-release/frontend/
test -f .azure-release/frontend/index.html
mkdir -p src/gateway-service/target/classes/static
cp -a .azure-release/frontend/. src/gateway-service/target/classes/static/
mvn -B -ntp -f src/gateway-service/pom.xml package
for service in auth catalogo pedidos pagos club-alan gateway; do
    source="src/${service}-service/target/${service}-service-0.0.1-SNAPSHOT.jar"
    test -f "$source"
    cp "$source" ".azure-release/jars/${service}-service.jar"
done
