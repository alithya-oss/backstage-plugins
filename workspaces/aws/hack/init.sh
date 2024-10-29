#!/usr/bin/env bash
set -euo pipefail

source hack/share/custom-logger.sh -V

function init_env()
{
  if [ ! -f .env ]
  then
    ewarn 'Environment ".env" file not found'
    ewarn 'Creating using default settings from ".env.example"'
    cp .env.example .env
  fi

  set -o allexport
  source .env
  set +o allexport
  eok "Environment variables initialized from \"${PWD}/.env\""

  if [[ -z ${GITHUB_INTEGRATION_CLIENT_ID} ]]
  then
    eerror "\"GITHUB_INTEGRATION_CLIENT_ID\" variable is not properly valued \".env\""
    exit 1
  elif [[ -z ${GITHUB_INTEGRATION_CLIENT_SECRET} ]]
  then
    eerror "\"GITHUB_INTEGRATION_CLIENT_SECRET\" variable is not properly valued \".env\""
    exit 1
  elif [[ -z ${GITHUB_INTEGRATION_APP_ID} ]]
  then
    eerror "\"GITHUB_INTEGRATION_APP_ID\"  variable is not properly valued \".env\""
    exit 1
  fi
}

function createorupdate_dependencies()
{
  einfo "Installing Backstage dependencies"
  
  yarn install

  yarn dedupe
}

init_env
createorupdate_dependencies