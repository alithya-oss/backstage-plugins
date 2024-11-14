ARG POSTGRES_VERSION="15.9.0"
FROM docker.io/bitnami/postgresql:${POSTGRES_VERSION}

USER root

ENV PG_CONFIG='/opt/bitnami/postgresql/bin/pg_config'

ARG VERSION="0.7.4"
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update -yqq \
    && apt-get install -yqq git build-essential \
    && cd /tmp \
    && git clone --branch v${VERSION} https://github.com/pgvector/pgvector.git \
    && cd pgvector/ \
    && make \
    && make install \
    && cd /tmp/ \
    && rm -rf pgvector/ \
    && apt-get remove git build-essential -y \
    && apt-get autoremove -y --purge \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/*

COPY --chown=1001:1001 scripts/00_vector.sh scripts/01_uuid-ossp.sh /docker-entrypoint-initdb.d/
RUN chmod +x \
    /docker-entrypoint-initdb.d/00_vector.sh \
    /docker-entrypoint-initdb.d/01_uuid-ossp.sh

USER 1001