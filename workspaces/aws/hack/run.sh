#!/usr/bin/env bash
set -euo pipefail

source hack/init.sh

docker compose -f docker-compose.yaml up --build --detach --remove-orphans

eok "Started docker stack"

until nc -vz localhost 5432
do
  einfo "Waiting for database startup"
  sleep 2s
done

einfo "Starting Backstage in development mode"

LOG_LEVEL=debug bash -c 'yarn dev' \
|| popd && docker compose stop
