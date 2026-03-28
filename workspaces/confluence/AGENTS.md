Backstage is an open platform for building developer portals. This is a TypeScript monorepo using Yarn workspaces.

## Key Directories

- `/packages`: Core framework packages (prefixed `@backstage/`)
- `/plugins`: Plugin packages (prefixed `@backstage/plugin-*`)
- `/packages/app`: Main example app using the new frontend system
- `/packages/app-legacy`: Example app using the old frontend system
- `/packages/backend`: Example backend for local development
- `/docs`: Documentation files

Packages prefixed with `core-` (e.g., `@backstage/core-plugin-api`) are part of the old frontend system. Packages prefixed with `frontend-` (e.g., `@backstage/frontend-plugin-api`) are part of the new frontend system. Packages prefixed with `backend-` (e.g., `@backstage/backend-plugin-api`) are part of the backend system.

## Development Flow

Before any of these commands can be run, you need to run `yarn install` in the project root.

- Build: There is no need to build the project during development, and it is verified automatically in the CI pipeline.
- Test: Use `CI=1 yarn test <path>` in the project root to run tests. The path can be either a single file or a directory. Always provide a path, avoid running all tests.
- Type checking: Use `yarn tsc` in the project root to run the type checker. Do not try to run it somewhere else than the project root and do not supply any options.
- Code formatting: Use `yarn prettier --write <...paths>` to format code. Run it explicitly for file paths that you know are changed, not for entire folders - otherwise it may change formatting of unrelated files.
- Lint: Use `yarn lint --fix` in the project root to run the linter.
- API reports: Before submitting a pull request with changes to any package in the workspace, run `yarn build:api-reports` in the project root to generate API reports for all packages.
- Dev server: Use `yarn start` to run the example app locally (frontend on :3000, backend on :7007).
- Create: Use `yarn new` to scaffold new plugins, packages, or modules.

You MUST NOT run builds or create a release by running `yarn build`, `yarn changesets version`, or `yarn release` as part of any changes. Builds and releases are made by separate workflows.

## Upstream synchronisation

This plugin is a one-on-one of the [Confluence community plugin workspace](https://github.com/backstage/community-plugins/tree/main/workspaces/confluence).

The synchronisation consists of:

1. Performing in the `workspaces/confluence` directory
2. Use the `.tmp` at the root of the repository for temporary data
3. Downloading the content of workspace of the `confluence` plugin
4. Replacing the prefix `@backstage-community/plugin` by `alithya-oss/backstage-plugin` in packages and associated imports
5. Adding the backstage Yarn plugin using the `yarn plugin import https://versions.backstage.io/v1/tags/main/yarn-plugin`
6. Replacing any version of `@backstage` packages by `backstage:^` in `package.json` files
7. Installing and deduplicating package dependencies (`yarn install`, `yarn dedupe`)
8. Regenerating API Reports (`yarn build:api-reports:only`)
