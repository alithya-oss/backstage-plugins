# [Backstage](https://backstage.io) AWS plugins

This repository contains a copy of [AWS Core]() and [AWS Harmonix]() plugins made for upstream best practices alignment purpose.
It allow to publish artifact under the `@alithya-oss` for the time to stabilise the CI process.

One done the content of the repository is submitted back in the form of pull-requests to the upstream project.

## Getting Started

### Environment variables

Variable | Description | Default | Documentation
--- | --- | --- | ---
`AUTOMATION_KEY` | Key used by piplines to interact with Backstage | _none_ | [doc](https://backstage.io/docs/auth/service-to-service-auth#static-tokens)
`SESSION_TOKEN` | Enables user sessions support for OIDC providers | _none_ | [doc](https://backstage.io/docs/auth/service-to-service-auth#static-tokens)
`POSTGRES_DB` | Name of the PostgreSQL database | `postgres` | [doc](https://backstage.io/docs/tutorials/switching-sqlite-postgres)
`POSTGRES_USER` | Name of the PostgreSQL used to connect to the database | `backstage` | [doc](https://backstage.io/docs/tutorials/switching-sqlite-postgres)
`POSTGRES_PASSWORD` | Password of the `POSTGRES_USER` used to connect to the database | `B4ck5t4g3Us3r` | [doc](https://backstage.io/docs/tutorials/switching-sqlite-postgres)
`POSTGRES_POSTGRES_PASSWORD` | Password of the native `postgres` used to connect to the database | `B4ck5t4g34dm1n` | [doc](https://backstage.io/docs/tutorials/switching-sqlite-postgres)
`POSTGRES_REPLICATION_PASSWORD` | Password used for cluster replication | `B4ck5t4g3R3pl1c4t10n` | [doc](https://backstage.io/docs/tutorials/switching-sqlite-postgres)
`AUTH_GITLAB_CLIENT_ID` | Client identifier of the Gitlab Application used for user authentication to Backstage | _none_ | [doc](https://backstage.io/docs/auth/gitlab/provider)
`AUTH_GITLAB_CLIENT_SECRET` | Client secret of the Gitlab Application used for user authentication to Backstage | _none_ | [doc](https://backstage.io/docs/auth/gitlab/provider)
`GITLAB_INTEGRATION_TOKEN` | Token used to process and reconcile Gitlab ressources (user, group, repository, etc.) | _none_ | [doc](https://backstage.io/docs/integrations/gitlab/locations)
`AUTH_GITHUB_CLIENT_ID` | Client identifier of the Github Apps used for user authentication to Backstage | _none_ | [doc](https://backstage.io/docs/auth/github/provider)
`AUTH_GITHUB_CLIENT_SECRET` | Client secret of the Github Apps used for user authentication to Backstage | _none_ | [doc](https://backstage.io/docs/auth/github/provider)
`GITHUB_INTEGRATION_TOKEN` | Token used to process and reconcile Github ressources (user, group, repository, etc.) | _none_ | [doc](https://backstage.io/docs/integrations/github/locations)
`GITHUB_INTEGRATION_APP_ID` | Application identifier of the Github Apps used to process and reconcile Github ressources (user, group, repository, etc.) | _none_ | [doc](https://backstage.io/docs/integrations/github/github-apps)
`GITHUB_INTEGRATION_ClIENT_ID` | Client identifier of the Github Apps used to process and reconcile Github ressources (user, group, repository, etc.) | _none_ | [doc](https://backstage.io/docs/integrations/github/github-apps)
`GITHUB_INTEGRATION_ClIENT_SECRET` | Secret identifier of the Github Apps used to process and reconcile Github ressources (user, group, repository, etc.) | _none_ | [doc](https://backstage.io/docs/integrations/github/github-apps)
`GITHUB_INTEGRATION_WEBHOOK_SECRET` | Webhook secret of the Github Apps used to receive events from Github ressources (user, group, repository, etc.) | `n/a` | [doc](https://backstage.io/docs/integrations/github/github-apps)
`GITHUB_INTEGRATION_PRIVATE_KEY` | Private key of the Github Apps used to process and reconcile Github ressources (user, group, repository, etc.) | _none_ | [doc](https://backstage.io/docs/integrations/github/github-apps)

### Configure environment file

Run the following command to generate the `.env` file containing the environment variables.

```sh
hack/init.sh
```

### Run in development mode

Run the following command to run the local Backstage instance in development mode backed by a PostgreSQL database.

```sh
hack/run.sh
```
