#!/usr/bin/env bash

export PGUSER='postgres'
export PGPASSWORD="${POSTGRES_POSTGRES_PASSWORD}"
export PGDATABASE='postgres'
echo "[${BASH_SOURCE[0]}]: Initializating Vector extension..."

psql -U postgres <<- EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;

    CREATE TABLE IF NOT EXISTS embeddings (
    id SERIAL PRIMARY KEY,
    embedding vector,
    text text,
    created_at timestamptz DEFAULT now()
    );
EOSQL


psql <<- EOSQL
    ALTER role ${POSTGRES_USER} superuser;
EOSQL
