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
        ./workspaces/aws/plugins/aws-codebuild-backend
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/codebuild/common/* \
        ./workspaces/aws/plugins/aws-codebuild-common
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/codebuild/frontend/* \
        ./workspaces/aws/plugins/aws-codebuild
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/codebuild/README.md \
        ./workspaces/aws/plugins/aws-codebuild.md

    # codepipeline
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/codepipeline/backend/* \
        ./workspaces/aws/plugins/aws-codepipeline-backend
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/codepipeline/common/* \
        ./workspaces/aws/plugins/aws-codepipeline-common
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/codepipeline/frontend/* \
        ./workspaces/aws/plugins/aws-codepipeline
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/codepipeline/README.md \
        ./workspaces/aws/plugins/aws-codepipeline.md

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
        ./workspaces/aws/plugins/aws-cost-insights-backend
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/cost-insights/common/* \
        ./workspaces/aws/plugins/aws-cost-insights-common
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/cost-insights/frontend/* \
        ./workspaces/aws/plugins/aws-cost-insights
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/cost-insights/README.md \
        ./workspaces/aws/plugins/aws-cost-insights.md

    # ecs
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/ecs/backend/* \
        ./workspaces/aws/plugins/amazon-ecs-backend
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/ecs/common/* \
        ./workspaces/aws/plugins/amazon-ecs-common
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/ecs/frontend/* \
        ./workspaces/aws/plugins/amazon-ecs
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/ecs/README.md \
        ./workspaces/aws/plugins/amazon-ecs.md
}

function rename() {
    changes=(
        "s#@aws/aws-core-plugin-for-backstage-scaffolder-actions#@alithya-oss/scaffolder-backend-module-aws-core#g"
        "s#@aws/amazon-ecs-plugin-for-backstage#@alithya-oss/plugin-amazon-ecs#g"
        "s#@aws/aws-codebuild-plugin-for-backstage#@alithya-oss/plugin-aws-codebuild#g"
        "s#@aws/aws-codepipeline-plugin-for-backstage#@alithya-oss/plugin-aws-codepipeline#g"
        "s#@aws/cost-insights-plugin-for-backstage#@alithya-oss/plugin-cost-insights-aws#g"
        "s#@aws/aws-core-plugin-for-backstage#@alithya-oss/plugin-aws-core#g"
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
cd ./workspaces/aws/
rename
yarn install
yarn backstage-cli versions:bump --release 1.30.2