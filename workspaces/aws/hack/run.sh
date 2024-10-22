#!/usr/bin/env bash
set -euo pipefail

source hack/init.sh


einfo start docker stack
docker compose -f docker-compose.yaml up --build --detach --remove-orphans

until nc -vz localhost 5432
do
  einfo "Waiting for database startup"
  sleep 2s
done

LOG_LEVEL=debug bash -c 'yarn dev' \
|| popd && docker compose down
