#!/usr/bin/env bash
set -eEuo pipefail

VERSION="main"

function sync() {
    mkdir -p .tmp/backstage-changelog-plugin/${VERSION}

    curl -fsSL https://github.com/RSC-Labs/backstage-changelog-plugin/archive/refs/heads/${VERSION}.tar.gz |
        tar -xvzf - \
            --strip-components=1 \
            --directory=.tmp/backstage-changelog-plugin/${VERSION} \
            backstage-changelog-plugin-${VERSION/"/"/"-"}/plugins

    # bulletin board
    rsync -av \
        .tmp/backstage-changelog-plugin/${VERSION/"/"/"-"}/plugins/backstage-changelog-plugin-backend/* \
        ./workspaces/changelog/plugins/changelog-backend
    rsync -av \
        .tmp/backstage-changelog-plugin/${VERSION/"/"/"-"}/plugins/backstage-changelog-plugin/* \
        ./workspaces/changelog/plugins/changelog
}

function rename() {
    changes=(
        "s#@rsc-labs/backstage-changelog-plugin-backend#@alithya-oss/backstage-plugin-changelog-backend#g"
        "s#@rsc-labs/backstage-changelog-plugin#@alithya-oss/backstage-plugin-changelog#g"
    )

    for item in "${changes[@]}"; do
    find -type f \
        -not -name "install-state.gz" \
        -not -name "yarn.lock" \
        -not -name "CHANGELOG.md" \
        -not -path "**/.yarn*" \
        -not -path "**/.changeset" \
        -not -path "**/node_modules*" \
        -not -path "**/dist*" \
        -exec sed -i ${item} {} +
    done
}

sync
cd ./workspaces/changelog/
rename
yarn install
yarn backstage-cli versions:bump --release 1.35.0
