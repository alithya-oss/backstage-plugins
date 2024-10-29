#!/usr/bin/env bash

export PGUSER='postgres'
export PGPASSWORD="${POSTGRES_POSTGRES_PASSWORD}"
export PGDATABASE='postgres'
echo "[${BASH_SOURCE[0]}]: Initializating Vector extension..."

psql -U postgres <<- EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL
