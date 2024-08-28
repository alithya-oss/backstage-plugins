#!/usr/bin/env bash
set -eEuo pipefail

VERSION="main"

function download()
{
    mkdir -p .tmp/community-plugins/${VERSION}

    curl -fsSL https://github.com/backstage/community-plugins/archive/refs/heads/${VERSION}.tar.gz \
        | tar -xvzf - \
        --strip-components=1 \
        --directory=.tmp/community-plugins/${VERSION} \
        community-plugins-${VERSION/"/"/"-"}/workspaces
}

function sync()
{
    rsync -av \
        .tmp/community-plugins/${VERSION/"/"/"-"}/workspaces/repo-tools \
        ./workspaces/
}

download
sync
