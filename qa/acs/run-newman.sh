#!/usr/bin/env bash
set -euo pipefail
network=${1:?network required}
root=${2:?gateway URL required}
[[ "$root" == http://gateway-service:8080 ]] || { echo 'Only the disposable CI gateway is supported' >&2; exit 2; }
mkdir -p reports
image='postman/newman@sha256:d9b5e780ead0026bbb37f3759cd7b10fc8a88cd4030c8266a7c5e343d75a5198'
cid=$(docker create --network "$network" "$image" run /etc/newman/collection.json \
  --env-var "baseUrl=$root" --env-var allowTestWrites=true --bail \
  --reporters cli,junit --reporter-junit-export /tmp/newman.xml)
trap 'docker rm -f "$cid" >/dev/null 2>&1 || true' EXIT
docker cp qa/acs/taqueria-e11.postman_collection.json "$cid:/etc/newman/collection.json"
docker start -a "$cid" || true
result=$(docker inspect --format '{{.State.ExitCode}}' "$cid")
docker cp "$cid:/tmp/newman.xml" reports/newman.xml
exit "$result"
