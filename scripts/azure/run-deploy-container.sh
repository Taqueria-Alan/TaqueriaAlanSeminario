#!/usr/bin/env bash
set -euo pipefail
set +x
cd "$(dirname "$0")/../.."
: "${AZURE_SP_FILE:?Falta Secret file azure-taqueria-sp en Jenkins}"
container=""
cleanup() {
    if [ -n "$container" ]; then docker rm -f "$container" >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT INT TERM
container=$(docker create --env AZURE_CONFIG_DIR=/tmp/azure-config \
    --entrypoint python3 mcr.microsoft.com/azure-cli:azurelinux3.0 \
    /tmp/deploy.py --credentials /tmp/azure-sp.json --jars /tmp/jars)
docker cp .azure-release/jars "$container:/tmp/"
docker cp scripts/azure/deploy-existing.py "$container:/tmp/deploy.py"
docker cp "$AZURE_SP_FILE" "$container:/tmp/azure-sp.json"
docker start -a "$container"
