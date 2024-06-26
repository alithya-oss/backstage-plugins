#!/usr/bin/env bash

#!/usr/bin/env bash

set -eEuo pipefail

VERSION="prateek/plugin-confluence-frontend"

function download()
{
    mkdir -p .tmp/roadie-backstage-plugins/${VERSION}

    curl -fsSL https://github.com/philips-software/philips-backstage-plugins/archive/refs/heads/${VERSION}.tar.gz \
        | tar -xvzf - \
        --strip-components=1 \
        --directory=.tmp/roadie-backstage-plugins/${VERSION} \
        philips-backstage-plugins-${VERSION/"/"/"-"}/workspaces/confluence
}

function sync()
{
    rsync -av \
        .tmp/roadie-backstage-plugins/${VERSION}/workspaces/confluence \
        ./workspaces/
}

download
sync


