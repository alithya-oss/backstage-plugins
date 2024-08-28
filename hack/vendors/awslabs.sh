#!/usr/bin/env bash
set -eEuo pipefail

VERSION="main"

function sync_aws_core() {
    mkdir -p .tmp/harmonix/${VERSION}

    curl -fsSL https://github.com/awslabs/harmonix/archive/refs/heads/${VERSION}.tar.gz |
        tar -xvzf - \
            --strip-components=1 \
            --directory=.tmp/harmonix/${VERSION} \
            harmonix-${VERSION/"/"/"-"}/plugins

    # codebuild
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/codebuild/backend/* \
        ./workspaces/aws/plugins/aws-codebuild-backend
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/codebuild/common/* \
        ./workspaces/aws/plugins/aws-codebuild-common
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/codebuild/frontend/* \
        ./workspaces/aws/plugins/aws-codebuild
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/codebuild/README.md \
        ./workspaces/aws/plugins/aws-codebuild.md

    # codepipeline
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/codepipeline/backend/* \
        ./workspaces/aws/plugins/aws-codepipeline-backend
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/codepipeline/common/* \
        ./workspaces/aws/plugins/aws-codepipeline-common
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/codepipeline/frontend/* \
        ./workspaces/aws/plugins/aws-codepipeline
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/codepipeline/README.md \
        ./workspaces/aws/plugins/aws-codepipeline.md

    # aws-core
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/core/common/* \
        ./workspaces/aws/plugins/aws-core-common
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/core/react/* \
        ./workspaces/aws/plugins/aws-core-react
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/core/scaffolder-actions/* \
        ./workspaces/aws/plugins/scaffolder-backend-module-aws-core-actions

    # cost-insights
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/cost-insights/backend/* \
        ./workspaces/aws/plugins/aws-cost-insights-backend
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/cost-insights/common/* \
        ./workspaces/aws/plugins/aws-cost-insights-common
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/cost-insights/frontend/* \
        ./workspaces/aws/plugins/aws-cost-insights
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/cost-insights/README.md \
        ./workspaces/aws/plugins/aws-cost-insights.md

    # ecs
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/ecs/backend/* \
        ./workspaces/aws/plugins/amazon-ecs-backend
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/ecs/common/* \
        ./workspaces/aws/plugins/amazon-ecs-common
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/ecs/frontend/* \
        ./workspaces/aws/plugins/amazon-ecs
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/plugins/ecs/README.md \
        ./workspaces/aws/plugins/amazon-ecs.md
}

function rename_aws_core() {
    changes=(
        "s#@aws/aws-core-plugin-for-backstage-scaffolder-actions#@alithya-oss/scaffolder-backend-module-aws-core-actions#g"
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

function sync_harmonix() {
    mkdir -p .tmp/harmonix/${VERSION}

    curl -fsSL https://github.com/awslabs/harmonix/archive/refs/heads/${VERSION}.tar.gz |
        tar -xvzf - \
            --strip-components=1 \
            --directory=.tmp/harmonix/${VERSION} \
            harmonix-${VERSION/"/"/"-"}/backstage-plugins/plugins

    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/backstage-plugins/plugins/aws-apps-backend/* \
        ./workspaces/aws/plugins/aws-apps-backend
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/backstage-plugins/plugins/aws-apps-common/* \
        ./workspaces/aws/plugins/aws-apps-common
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/backstage-plugins/plugins/aws-apps/* \
        ./workspaces/aws/plugins/aws-apps
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/backstage-plugins/plugins/catalog-backend-module-aws-apps-entities-processor \
        ./workspaces/aws/plugins/catalog-backend-module-aws-apps-entities-processor
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/backstage-plugins/plugins/scaffolder-backend-module-aws-apps \
        ./workspaces/aws/plugins/scaffolder-backend-module-aws-apps
}

function rename_harmonix() {
    changes=(
        "s#@aws/plugin-aws-apps-for-backstage#@alithya-oss/plugin-aws-apps#g"
        "s#@aws/plugin-aws-apps-backend-for-backstage#@alithya-oss/plugin-aws-apps-backend#g"
        "s#@aws/plugin-aws-apps-common-for-backstage#@alithya-oss/plugin-aws-apps-common#g"
        "s#@aws/backstage-plugin-catalog-backend-module-aws-apps-entities-processor#@alithya-oss/plugin-catalog-backend-module-aws-apps-entities-processor#g"
        "s#@aws/plugin-scaffolder-backend-aws-apps-for-backstage#@alithya-oss/plugin-scaffolder-backend-aws-apps#g"
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

# sync_aws_core
sync_harmonix
cd ./workspaces/aws/
# rename_aws_core
rename_harmonix
# yarn install
# yarn backstage-cli versions:bump --release 1.30.2
