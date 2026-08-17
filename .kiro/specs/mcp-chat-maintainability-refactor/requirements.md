# Requirements Document

## Introduction

The `workspaces/mcp-chat` workspace contains 13 packages and approximately 22,500 lines of TypeScript: a frontend plugin, a backend plugin, a common package, a node package, and nine LLM provider backend modules. The current layout mixes Node-only code into the isomorphic common package, exposes backend internals as public API, duplicates provider registration logic nine times, concentrates unrelated responsibilities into single 500-to-700-line files, wires the frontend plugin twice through two independent entry points, and leaves several units untested.

This feature restructures the workspace so that a human maintainer can locate, understand, and change any single concern without reading unrelated code. The refactor realigns package boundaries with the Backstage new backend system and new frontend system, extracts shared provider behaviour into reusable building blocks, decomposes oversized units, unifies error handling, and adds tests for the units that gain or change structure.

The refactor introduces breaking changes to the published package APIs. External behaviour that adopters observe at runtime — HTTP route paths, HTTP response shapes, configuration keys, and user-visible chat behaviour — is preserved unchanged. Adopters migrate through documented steps in changesets, not through code changes forced by behaviour differences.

## Glossary

- **Workspace**: The `workspaces/mcp-chat` directory, its 13 packages, and its workspace-level configuration files (`package.json`, `yarn.lock`, `backstage.json`, `bcp.json`, `.changeset/`).
- **Common_Package**: The `@backstage-community/plugin-mcp-chat-common` package.
- **Node_Package**: The `@backstage-community/plugin-mcp-chat-node` package.
- **Backend_Plugin**: The `@backstage-community/plugin-mcp-chat-backend` package.
- **Frontend_Plugin**: The `@backstage-community/plugin-mcp-chat` package.
- **Provider_Module**: Any one of the nine `@backstage-community/plugin-mcp-chat-backend-module-*` packages (agentgateway, amazon-bedrock, anthropic, azure-openai, gemini, litellm, ollama, openai, openai-responses).
- **LLM_Provider**: The provider contract implemented by each Provider_Module and consumed by the Backend_Plugin to reach a large language model service.
- **Provider_Module_Factory**: The shared helper in the Node_Package that builds a Backstage backend module for one LLM_Provider from a provider identifier, a default base URL, and a provider constructor.
- **OpenAI_Compatible_Base**: The shared abstract provider class in the Node_Package that implements request header construction, request formatting, response parsing, and connection testing for LLM services exposing an OpenAI-compatible HTTP interface.
- **Provider_Extension_Point**: The Backstage extension point, exported from the Node_Package, through which a Provider_Module registers an LLM_Provider with the Backend_Plugin.
- **MCP_Client_Service**: The Backend_Plugin service that owns Model Context Protocol server lifecycle, tool invocation, and provider and server status reporting.
- **Route_Module**: Any one of the four Backend_Plugin HTTP route modules.
- **Error_Middleware**: The Express error-handling middleware produced by `MiddlewareFactory` from `@backstage/backend-defaults`.
- **Frontend_Wiring_Module**: The single internal Frontend_Plugin module that owns the shared route reference, the API factory definition, and the chat page loader consumed by both Frontend_Plugin entry points.
- **Legacy_Entry_Point**: The Frontend_Plugin `plugin.ts` entry point built on `createPlugin` from `@backstage/core-plugin-api`.
- **Alpha_Entry_Point**: The Frontend_Plugin `/alpha` entry point built on `createFrontendPlugin` from `@backstage/frontend-plugin-api`.
- **Verification_Pipeline**: The workspace command set `yarn tsc:full`, `yarn lint --fix`, targeted `yarn test <path>`, `yarn build:api-reports`, and `yarn build:knip-reports`, each run from `workspaces/mcp-chat`.
- **Changeset_Set**: The changeset files under `workspaces/mcp-chat/.changeset/` that describe the release impact of this refactor.
- **Contract_Type**: A TypeScript type describing data exchanged between the Frontend_Plugin and the Backend_Plugin over HTTP.
- **View_Model_Field**: A field on a Frontend_Plugin type that exists to drive presentation state and is absent from the corresponding HTTP payload.

## Requirements

### Requirement 1

**User Story:** As a maintainer, I want the common package to hold only isomorphic contract types, so that I can import it from browser code without pulling Node-only dependencies.

#### Acceptance Criteria

1. THE Common_Package SHALL export the Contract_Types shared between the Frontend_Plugin and the Backend_Plugin.
2. THE Common_Package SHALL declare a dependency set that excludes `@backstage/backend-plugin-api`.
3. THE Common_Package SHALL resolve every type reference through a top-level import statement.
4. THE Node_Package SHALL own the provider base class that calls the global `fetch` function and accepts a `LoggerService` instance.
5. THE Common_Package SHALL declare a dependency set in which every declared dependency is referenced by at least one source file.
6. WHEN `yarn build:knip-reports` runs, THE Common_Package SHALL produce a Knip report that lists zero unused dependencies.

### Requirement 2

**User Story:** As a maintainer, I want the node package to be the single provider extension surface, so that I have one place to look when changing how providers plug in.

#### Acceptance Criteria

1. THE Node_Package SHALL export the LLM_Provider contract.
2. THE Node_Package SHALL export the Provider_Extension_Point created through `createExtensionPoint` from `@backstage/backend-plugin-api`.
3. THE Node_Package SHALL export exactly one declaration of the provider configuration type.
4. THE Node_Package SHALL export every type that its own exported declarations reference in their public signatures.
5. WHERE a source file in the Node_Package re-exports a declaration that no other package imports, THE refactor SHALL remove that source file.
6. THE Node_Package SHALL contain test files that reference only exported declarations of the Node_Package.

### Requirement 3

**User Story:** As a maintainer, I want the backend plugin to publish only its plugin entry, so that I can change internals without breaking adopters.

#### Acceptance Criteria

1. THE Backend_Plugin SHALL export its `createBackendPlugin` result as the sole entry of its public API.
2. WHERE a Backend_Plugin source file exists only to re-export a declaration for backwards compatibility, THE refactor SHALL remove that source file.
3. THE Backend_Plugin SHALL declare `@backstage/backend-defaults` and `@backstage/plugin-catalog-node` in the dependency field that matches the packages consuming them.
4. THE Backend_Plugin SHALL declare a dependency set that excludes every Provider_Module.
5. THE Backend_Plugin SHALL register its Provider_Extension_Point before its single `registerInit` call.
6. WHEN `yarn build:api-reports` runs, THE Backend_Plugin SHALL produce an API report containing one exported declaration.

### Requirement 4

**User Story:** As a maintainer, I want each provider module reduced to its vendor-specific parts, so that adding or fixing a provider touches one small file.

#### Acceptance Criteria

1. THE Provider_Module_Factory SHALL accept a provider identifier, a default base URL, and a provider constructor, and SHALL return a Backstage backend module.
2. THE Provider_Module_Factory SHALL read the provider entry matching the supplied provider identifier from the `mcpChat.providers` configuration array.
3. WHERE the configuration entry for a provider omits a base URL, THE Provider_Module_Factory SHALL apply the default base URL supplied by that Provider_Module.
4. THE Provider_Module_Factory SHALL register the constructed LLM_Provider through the Provider_Extension_Point.
5. THE Provider_Module_Factory SHALL populate the `maxTokens` and `temperature` fields of the provider configuration from the corresponding configuration keys.
6. Each Provider_Module SHALL declare a dependency on the Node_Package and SHALL declare a dependency set that excludes the Backend_Plugin.
7. Each Provider_Module SHALL contain a configuration schema declaration covering the configuration keys that Provider_Module reads.
8. THE refactor SHALL remove the per-module authentication record reader whose result no LLM_Provider reads.
9. Each Provider_Module SHALL declare a dependency set in which every declared dependency is referenced by at least one source file.

### Requirement 5

**User Story:** As a maintainer, I want OpenAI-compatible providers to share one implementation, so that a protocol fix lands in one place.

#### Acceptance Criteria

1. THE OpenAI_Compatible_Base SHALL implement request header construction, request formatting, response parsing, and connection testing for OpenAI-compatible LLM services.
2. THE OpenAI_Compatible_Base SHALL map HTTP status codes 401, 403, 404, and 429 to distinct connection-test results.
3. THE openai, litellm, agentgateway, and azure-openai Provider_Modules SHALL derive their LLM_Provider implementation from the OpenAI_Compatible_Base.
4. WHERE an OpenAI-compatible LLM service requires vendor-specific header, request, or response handling, THE corresponding Provider_Module SHALL override the matching OpenAI_Compatible_Base member.
5. THE OpenAI_Compatible_Base SHALL apply the `maxTokens` and `temperature` values of the supplied provider configuration to each outbound model request.

### Requirement 6

**User Story:** As a maintainer, I want the MCP client service and backend utilities split by responsibility, so that I can read one concern at a time.

#### Acceptance Criteria

1. THE refactor SHALL separate Model Context Protocol server lifecycle handling, query processing, provider status reporting, and Model Context Protocol server status reporting into distinct units.
2. Each unit produced from the MCP_Client_Service SHALL occupy at most 300 lines of source code.
3. THE Model Context Protocol server initialisation unit SHALL express each transport strategy as a separately named unit.
4. THE Model Context Protocol server initialisation unit SHALL declare its transport options through a named type rather than the `any` type.
5. THE refactor SHALL separate server configuration loading, configuration validation, executable path resolution, tool invocation, message validation, and guest user identification into distinct units.
6. Each unit produced from the backend utilities file SHALL occupy at most 300 lines of source code.
7. Each unit produced from the backend utilities file SHALL emit diagnostic output through an injected `LoggerService` instance.

### Requirement 7

**User Story:** As a maintainer, I want one error-handling path in the backend, so that failures reach the client in a single predictable shape.

#### Acceptance Criteria

1. THE Backend_Plugin SHALL register the Error_Middleware as the final middleware of its Express router.
2. Each Route_Module SHALL signal request failures by throwing an error type from `@backstage/errors`.
3. WHEN a conversation persistence operation fails, THE conversation Route_Module SHALL log the failure through the injected `LoggerService` instance and SHALL propagate an error to the Error_Middleware.
4. THE conversation Route_Module SHALL detect a missing persistence table through a typed condition rather than a message substring comparison.
5. THE Backend_Plugin SHALL return the HTTP status codes and response body fields that the current implementation returns for each supported request and failure case.

### Requirement 8

**User Story:** As a maintainer, I want both frontend entry points fed by one wiring module, so that the two wirings stay identical.

#### Acceptance Criteria

1. THE Frontend_Wiring_Module SHALL own the route reference, the API factory definition, and the chat page loader of the Frontend_Plugin.
2. THE Legacy_Entry_Point SHALL obtain its route reference, API factory definition, and chat page loader from the Frontend_Wiring_Module.
3. THE Alpha_Entry_Point SHALL obtain its route reference, API factory definition, and chat page loader from the Frontend_Wiring_Module.
4. THE Frontend_Plugin SHALL declare the route reference through a single `createRouteRef` call that takes no identifier argument.
5. THE Alpha_Entry_Point SHALL declare its chat page through `PageBlueprint` and SHALL declare nested pages through `SubPageBlueprint`.
6. THE Alpha_Entry_Point SHALL declare an `ApiBlueprint` extension for each API that adopters extend.
7. THE Frontend_Plugin SHALL export both the Legacy_Entry_Point and the Alpha_Entry_Point.

### Requirement 9

**User Story:** As a maintainer, I want frontend code on new frontend system imports and shared contract types, so that types and APIs come from one source.

#### Acceptance Criteria

1. THE Frontend_Plugin SHALL declare a dependency on the Common_Package and SHALL import each Contract_Type from the Common_Package.
2. WHERE a Frontend_Plugin type carries a View_Model_Field, THE Frontend_Plugin SHALL declare that type locally as an extension of the corresponding Contract_Type.
3. THE Frontend_Plugin SHALL import `useApi` and `configApiRef` from `@backstage/frontend-plugin-api`.
4. THE Frontend_Plugin chat page loader SHALL render the page content without the `Page` and `Header` components from `@backstage/core-components`.
5. WHEN a `fetch` call returns a non-OK response, THE Frontend_Plugin SHALL construct the resulting error through `ResponseError.fromResponse`.
6. THE Frontend_Plugin hooks SHALL expose failures as `Error` instances.
7. THE Frontend_Plugin chat page SHALL present the failures that its hooks expose without constructing a replacement error.

### Requirement 10

**User Story:** As a maintainer, I want large frontend components split into presentation and state units, so that I can change layout without reading effect logic.

#### Acceptance Criteria

1. THE refactor SHALL separate state and effect logic from presentation markup in the chat message, right pane, and chat container components.
2. Each unit produced from the chat message, right pane, and chat container components SHALL occupy at most 250 lines of source code.
3. Each unit produced from the chat message, right pane, and chat container components SHALL declare its styles through the styling mechanism already used by the Frontend_Plugin.
4. THE Frontend_Plugin SHALL render the same visible content and SHALL respond to the same user interactions as the current implementation.

### Requirement 11

**User Story:** As a maintainer, I want tests covering the restructured and previously untested units, so that a later change tells me when it breaks something.

#### Acceptance Criteria

1. THE Workspace SHALL contain a test file for each Provider_Module backend module declaration.
2. THE Workspace SHALL contain a test file for each Route_Module and for the backend authentication middleware.
3. THE Workspace SHALL contain a test file for the Provider_Module_Factory and for the OpenAI_Compatible_Base.
4. THE Workspace SHALL contain a test file for each unit produced from the MCP_Client_Service and from the backend utilities file.
5. THE Workspace SHALL contain a test file for the agentgateway LLM_Provider, the conversations hook, and the bot icon component.
6. THE Workspace SHALL contain a test file for each unit produced from the chat message, right pane, and chat container components.
7. Each React component test SHALL query rendered output through the `screen` object and the `findBy*` query family.
8. THE Frontend_Plugin implementation SHALL expose the elements its tests query without added test identifier attributes.

### Requirement 12

**User Story:** As an adopter, I want the runtime contract unchanged, so that upgrading requires only the documented package-level migration.

#### Acceptance Criteria

1. THE Backend_Plugin SHALL serve the HTTP route paths that the current implementation serves.
2. THE Workspace SHALL read the `mcpChat.*` configuration keys that the current implementation reads.
3. THE Frontend_Plugin SHALL preserve the chat, conversation, provider selection, and Model Context Protocol server behaviours that a user observes today.
4. THE Changeset_Set SHALL contain one changeset entry for each published package this refactor changes.
5. WHERE a package change removes or relocates an exported declaration, THE corresponding changeset entry SHALL state the removed or relocated declaration, its new location, and the steps an adopter takes to migrate.

### Requirement 13

**User Story:** As a maintainer, I want the refactor to satisfy the workspace verification gates, so that continuous integration passes on the first run.

#### Acceptance Criteria

1. WHEN `yarn tsc:full` runs in `workspaces/mcp-chat`, THE Workspace SHALL complete the command with exit code 0.
2. WHEN `yarn lint --fix` runs in `workspaces/mcp-chat`, THE Workspace SHALL complete the command with exit code 0.
3. WHEN `yarn test` runs against each added or changed test path, THE Workspace SHALL complete the command with exit code 0.
4. WHEN `yarn build:api-reports` runs in `workspaces/mcp-chat`, THE Workspace SHALL complete the command with exit code 0 and SHALL leave the committed API report files matching the generated output.
5. WHEN `yarn build:knip-reports` runs in `workspaces/mcp-chat`, THE Workspace SHALL complete the command with exit code 0 and SHALL leave the committed Knip report files matching the generated output.
6. Each source file the refactor adds SHALL begin with an Apache 2.0 copyright header stating the current year.
7. THE refactor SHALL leave the copyright year of each pre-existing source file unchanged.
8. THE refactor SHALL leave the ESLint, Prettier, and TypeScript configuration files of the Workspace unchanged.
