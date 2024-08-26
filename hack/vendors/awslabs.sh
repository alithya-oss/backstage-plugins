#!/usr/bin/env bash
set -eEuo pipefail

VERSION="main"

function sync() {
    mkdir -p .tmp/backstage-plugins-for-aws/${VERSION}

    curl -fsSL https://github.com/awslabs/backstage-plugins-for-aws/archive/refs/heads/${VERSION}.tar.gz |
        tar -xvzf - \
            --strip-components=1 \
            --directory=.tmp/backstage-plugins-for-aws/${VERSION} \
            backstage-plugins-for-aws-${VERSION/"/"/"-"}/plugins
    
    # codebuild
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/codebuild/backend/* \
        ./workspaces/aws/plugins/codebuild-backend
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/codebuild/common/* \
        ./workspaces/aws/plugins/codebuild-common
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/codebuild/frontend/* \
        ./workspaces/aws/plugins/codebuild
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/codebuild/README.md \
        ./workspaces/aws/plugins/codebuild.md

    # codepipeline
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/codepipeline/backend/* \
        ./workspaces/aws/plugins/codepipeline-backend
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/codepipeline/common/* \
        ./workspaces/aws/plugins/codepipeline-common
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/codepipeline/frontend/* \
        ./workspaces/aws/plugins/codepipeline
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/codepipeline/README.md \
        ./workspaces/aws/plugins/codepipeline.md
    
    # aws-core
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/core/common/* \
        ./workspaces/aws/plugins/aws-core-common
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/core/react/* \
        ./workspaces/aws/plugins/aws-core-react
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/core/scaffolder-actions/* \
        ./workspaces/aws/plugins/scaffolder-backend-module-aws-core-actions

    # cost-insights
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/cost-insights/backend/* \
        ./workspaces/aws/plugins/codepipeline-backend
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/cost-insights/common/* \
        ./workspaces/aws/plugins/codepipeline-common
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/cost-insights/frontend/* \
        ./workspaces/aws/plugins/codepipeline
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/cost-insights/README.md \
        ./workspaces/aws/plugins/cost-insights.md

    # ecs
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/ecs/backend/* \
        ./workspaces/aws/plugins/codepipeline-backend
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/ecs/common/* \
        ./workspaces/aws/plugins/codepipeline-common
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/ecs/frontend/* \
        ./workspaces/aws/plugins/codepipeline
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/ecs/README.md \
        ./workspaces/aws/plugins/codepipeline.md
}

sync
