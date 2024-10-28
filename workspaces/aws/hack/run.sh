#!/usr/bin/env bash
set -euo pipefail


cleanup(){
  docker compose stop
}

# Trap the SIGINT signal (Ctrl+C)
trap cleanup SIGINT

source hack/init.sh

docker compose -f docker-compose.yaml up --build --detach --remove-orphans

eok "Started docker stack"

until nc -vz localhost 5432
do
  einfo "Waiting for database startup"
  sleep 5s
done

einfo "Starting Backstage in development mode"

LOG_LEVEL=debug yarn dev
