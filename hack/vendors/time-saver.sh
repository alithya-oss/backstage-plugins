#!/usr/bin/env bash

set -eEuo pipefail

VERSION="main"

function download()
{
    mkdir -p .tmp/time-saver-plugins/${VERSION}

    curl -fsSL https://github.com/tduniec/backstage-timesaver-plugin/archive/refs/heads/${VERSION}.tar.gz \
        | tar -xvzf - \
        --strip-components=1 \
        --directory=".tmp/time-saver-plugins/${VERSION}" \
        backstage-timesaver-plugin-${VERSION}/plugins
}

function sync()
{
    rsync -av \
        .tmp/time-saver-plugins/${VERSION}/plugins/time-saver-backend \
        .tmp/time-saver-plugins/${VERSION}/plugins/time-saver-common \
        .tmp/time-saver-plugins/${VERSION}/plugins/time-saver \
        workspaces/time-saver/plugins
}

download
sync