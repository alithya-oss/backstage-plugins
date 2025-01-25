#!/usr/bin/env bash
set -eEuo pipefail

VERSION="main"

function sync() {
    mkdir -p .tmp/backstage-plugin-bulletin-board/${VERSION}

    curl -fsSL https://github.com/v-ngu/backstage-plugin-bulletin-board/archive/refs/heads/${VERSION}.tar.gz |
        tar -xvzf - \
            --strip-components=1 \
            --directory=.tmp/backstage-plugin-bulletin-board/${VERSION} \
            backstage-plugin-bulletin-board-${VERSION/"/"/"-"}/plugins

    # bulletin board
    rsync -av \
        .tmp/backstage-plugin-bulletin-board/${VERSION/"/"/"-"}/plugins/bulletin-board-backend/* \
        ./workspaces/bulletin-board/plugins/bulletin-board-backend
    rsync -av \
        .tmp/backstage-plugin-bulletin-board/${VERSION/"/"/"-"}/plugins/bulletin-board/* \
        ./workspaces/bulletin-board/plugins/bulletin-board
}

function rename() {
    changes=(
        "s#@backstage-plugin-bulletin-board-backend#@alithya-oss/backstage-plugin-bulletin-board-backend#g"
        "s#@backstage-plugin-bulletin-board#@alithya-oss/backstage-plugin-bulletin-board#g"
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
cd ./workspaces/bulletin-board/
rename
yarn install
yarn backstage-cli versions:bump --release 1.35.0
