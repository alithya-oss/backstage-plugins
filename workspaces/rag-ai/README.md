![Static Badge](https://img.shields.io/badge/maintenance_status-active-green)

# [Rag AI](https://roadie.io/backstage/plugins/ai-assistant-rag-ai)

This workspace contains a fork of the [Roadie's RAG AI plugin](https://roadie.io/backstage/plugins/ai-assistant-rag-ai) performed to add fully declarative configuration support.

## Getting started

### Configure the environment

In the root directory of the workspace, copy the `.env.example` as `.env` and update the is file.

| Variable                        | App config variable                             | Description                                                                                                                                         | Default     |
| ------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `EXTERNAL_CALLER_AUTH_KEY`      | `.backend.auth.externalAccess.[].options.token` | Access token used to connect to the Backstagte API _(see: [Generate token](https://backstage.io/docs/auth/service-to-service-auth/#legacy-tokens))_ | `nil`       |
| `POSTGRES_DB`                   | `.backend.database.connection.database`         | Name of the PostgreSQL database                                                                                                                     | `postgres`  |
| `POSTGRES_USER`                 | `.backend.database.connection.user`             | Name of the user to connect to the PostgreSQL database                                                                                              | `backstage` |
| `POSTGRES_PASSWORD`             | `.backend.database.connection.password`         | Password for the PostgreSQL `postgres` user                                                                                                         | `nil`       |
| `POSTGRES_POSTGRES_PASSWORD`    |                                                 | Password of the default `postgres` admin user                                                                                                       | `nil`       |
| `POSTGRES_REPLICATION_PASSWORD` |                                                 | Password for the PostgreSQL replication user                                                                                                        | `nil`       |
| `AWS_ACCESS_KEY_ID`             | `.aws.mainAccount.accessKeyId`                  | **Optional**: Identifier of the AWS access key                                                                                                      | `nil`       |
| `AWS_SECRET_ACCESS_KEY`         | `.aws.mainAccount.secretAccessKey`              | **Optional**: Secret associated to the the AWS access key                                                                                           | `nil`       |
| `AWS_INTEGRATION_ROLE_NAME`     | `.aws.accountDefaults.roleName`                 | **Optional**: Name of the IAM used to connect to Amazon Bedrock                                                                                     | `nil`       |
| `AWS_INTEGRATION_REGION`        | `.aws.accountDefaults.region`                   | **Optional**: AWS region to connect to                                                                                                              | `us-east-1` |

### Local development

Once the `.env` file completed, start the local development server.

```sh
# Install the app dependencies
yarn install

# Initialize the environment variables
set -a && source .env && set +a

# Start the terminal
yarn dev
```

### Create embedings

Wait few minutes until the catalog get populated, then generate embeddings from the Backstage catalog content (API, Component, Resource, etc.).

```sh
yarn  dev:create-embeddings
```
