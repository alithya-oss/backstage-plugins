#!/usr/bin/env bash
set -eEuo pipefail

VERSION="main"

function sync_aws_core() {
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
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/core/node/* \
        ./workspaces/aws/plugins/aws-core-node
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/core/react/* \
        ./workspaces/aws/plugins/aws-core-react
    rsync -av \
        .tmp/backstage-plugins-for-aws/${VERSION/"/"/"-"}/plugins/core/scaffolder-actions/* \
        ./workspaces/aws/plugins/scaffolder-backend-module-aws-core

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

function rename_aws_core() {
    changes=(
        "s#@aws/aws-core-plugin-for-backstage-scaffolder-actions#@alithya-oss/plugin-scaffolder-backend-module-aws-core#g"
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

function sync_harmonix_reference_repo() {
    GITLAB_HOSTNAME=${GITLAB_HOSTNAME:-'gitlab.com'}
    GITLAB_GROUP=${GITLAB_GROUP:-'alithya-csna/cloud/aws/harmonix'}
    AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-'123456789012'}

    mkdir -p .tmp/harmonix/${VERSION}

    curl -fsSL https://github.com/awslabs/harmonix/archive/refs/heads/${VERSION}.tar.gz |
        tar -xvzf - \
            --strip-components=1 \
            --directory=.tmp/harmonix/${VERSION} \
            harmonix-${VERSION/"/"/"-"}/backstage-reference \
            harmonix-${VERSION/"/"/"-"}/iac/roots

    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/backstage-reference/* \
        ./workspaces/aws/reference/
    rsync -av \
        .tmp/harmonix/${VERSION/"/"/"-"}/iac/roots/* \
        ./workspaces/aws/reference/environments

    if [[ "$OSTYPE" == "darwin"* ]]; then
        find ./workspaces/aws/reference -type f -name "*.yaml" -exec sed -i "" "s#{{ *gitlab_hostname *}}#$GITLAB_HOSTNAME#g" {} +; 
        find ./workspaces/aws/reference -type f -name "*.yaml" -exec sed -i "" "s#{{ *awsAccount *}}#$AWS_ACCOUNT_ID#g" {} +; 

        find ./workspaces/aws/reference -type f -name "*.yml" -exec sed -i "" "s#opa-admin\/backstage-reference#${GITLAB_GROUP}/reference#g" {} +;
        find ./workspaces/aws/reference -type f -name "*.yaml" -exec sed -i "" "s#opa-admin\/backstage-reference#${GITLAB_GROUP}/reference#g" {} +;
        find ./workspaces/aws/reference -type f -name "*.yaml" -exec sed -i "" "s#aws-environment-providers#$GITLAB_GROUP#g" {} +;
        find ./workspaces/aws/reference -type f -name "*.yaml" -exec sed -i "" "s#\/opa\/#/harmonix/#g" {} +;
    else
        find ./workspaces/aws/reference -type f -name "*.yaml" -exec sed -i "s#{{ *gitlab_hostname *}}#$GITLAB_HOSTNAME#g" {} +; 
        find ./workspaces/aws/reference -type f -name "*.yaml" -exec sed -i "s#{{ *awsAccount *}}#$AWS_ACCOUNT_ID#g" {} +; 

        find ./workspaces/aws/reference -type f -name "*.yml" -exec sed -i "s#opa-admin\/backstage-reference#${GITLAB_GROUP}/reference#g" {} +;
        find ./workspaces/aws/reference -type f -name "*.yaml" -exec sed -i "s#opa-admin\/backstage-reference#$GITLAB_GROUP/reference#g" {} +;
        find ./workspaces/aws/reference -type f -name "*.yaml" -exec sed -i "s#aws-environment-providers#$GITLAB_GROUP#g" {} +;
        find ./workspaces/aws/reference -type f -name "*.yaml" -exec sed -i "s#\/opa\/#/harmonix/#g" {} +;
    fi
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
# sync_harmonix
sync_harmonix_reference_repo
cd ./workspaces/aws/
# rename_aws_core
# rename_harmonix
# yarn install
# yarn backstage-cli versions:bump --release 1.30.4