# Requirements Document

## Introduction

The `workspaces/mcp-chat` workspace in the user's fork diverged from the upstream `backstage/community-plugins` repository after the fork underwent a major architectural refactor — splitting a monolithic 2-package structure (frontend + backend) into a layered 13-package architecture with dedicated common, node, provider module, backend, and frontend packages.

Since the fork diverged, the upstream repository has continued to evolve. This feature identifies the improvements, fixes, and behavioural additions that appeared upstream after the fork point and ports them into the refactored architecture without violating the layered design principles established during the refactor.

Key upstream changes identified for porting:

1. **ResponseError integration in base provider** — upstream uses `ResponseError.fromResponse` from `@backstage/errors` in the LLM provider base class `makeRequest` method; the fork throws a plain `Error` string.
2. **QuickPrompts configuration validation** — upstream validates `mcpChat.quickPrompts` entries in `validateConfig`; the fork already has this (confirmed present).
3. **Conversation title update route** — upstream exposes `PATCH /conversations/:id/title`; the fork already has this (confirmed present).
4. **Upstream test coverage additions** — upstream added test files for `base-provider`, `gemini-provider`, `litellm-provider`, `ollama-provider`, `openai-responses-provider`, `provider-factory`, `ChatConversationStore`, `MCPClientServiceImpl`, `SummarizationService`, `utils`, `router`, `alpha` entry, `plugin`, and frontend hooks (`useAvailableTools`, `useMcpServers`, `useProviderStatus`). Several of these test patterns and edge-case scenarios should be ported where the fork's corresponding tests are missing coverage.
5. **ResponseError usage in frontend API client** — upstream frontend uses `ResponseError.fromResponse(response)` consistently; the fork should verify consistent usage.
6. **Upstream dependency bumps** — upstream bumps `@modelcontextprotocol/sdk` to `^1.25.2`, `@google/genai` to `^1.41.0`, `ollama` to `^0.6.0`, and `express` to `^4.22.0`.
7. **Upstream Backstage framework version** — upstream targets `supported-versions: 1.40.0` and uses `@backstage/backend-plugin-api: ^1.8.0`, `@backstage/frontend-plugin-api: ^0.15.1`.

Items already present in the fork (no porting needed): conversation history with search, starred conversations, optimistic updates, title auto-summarization, guest user detection, auth middleware, decomposed route modules, QuickStart component with config-driven prompts.

## Glossary

- **Upstream**: The `backstage/community-plugins` repository's `main` branch mcp-chat workspace, cached at `.tmp/community-plugins/main/workspaces/mcp-chat`.
- **Fork**: The user's workspace at `workspaces/mcp-chat` containing 13 packages in a layered architecture.
- **Common_Package**: The `@alithya-oss/backstage-plugin-mcp-chat-common` (or `@backstage-community/plugin-mcp-chat-common`) package in the Fork holding browser-safe contract types.
- **Node_Package**: The `@alithya-oss/backstage-plugin-mcp-chat-node` (or `@backstage-community/plugin-mcp-chat-node`) package in the Fork exporting the LLMProvider base class, OpenAICompatibleBase, createLlmProviderModule, and extension point.
- **Backend_Plugin**: The `@alithya-oss/backstage-plugin-mcp-chat-backend` (or `@backstage-community/plugin-mcp-chat-backend`) package in the Fork with a single default export.
- **Frontend_Plugin**: The `@alithya-oss/backstage-plugin-mcp-chat` (or `@backstage-community/plugin-mcp-chat`) package in the Fork.
- **Provider_Module**: Any one of the nine Fork backend module packages that register an LLM provider via the extension point.
- **LLMProvider_Base**: The `LLMProvider` abstract class in the Node_Package.
- **OpenAI_Compatible_Base**: The shared abstract class in the Node_Package for providers exposing an OpenAI-compatible HTTP interface.
- **ResponseError**: The `ResponseError` class from `@backstage/errors` that constructs structured error objects from HTTP response objects.
- **Verification_Pipeline**: The workspace command set `yarn tsc:full`, `yarn lint --fix`, targeted `yarn test <path>`, `yarn build:api-reports`, and `yarn build:knip-reports`, each run from `workspaces/mcp-chat`.

## Requirements

### Requirement 1: Port ResponseError Integration to LLMProvider Base

**User Story:** As a maintainer, I want provider HTTP failures to propagate as structured Backstage errors, so that error metadata (status code, body) is preserved for logging and debugging.

#### Acceptance Criteria

1. WHEN an HTTP response from an LLM service returns a non-OK status, THE LLMProvider_Base `makeRequest` method SHALL throw a `ResponseError` constructed via `ResponseError.fromResponse` from `@backstage/errors`.
2. THE Node_Package SHALL declare `@backstage/errors` in its dependency set.
3. THE OpenAI_Compatible_Base SHALL inherit the `makeRequest` behaviour from LLMProvider_Base without overriding the error-throwing mechanism.
4. WHERE a Provider_Module overrides `makeRequest` (such as the openai-responses module), THE Provider_Module SHALL also throw a `ResponseError` for non-OK HTTP responses.
5. THE existing test files for provider modules SHALL pass after the error type changes.

### Requirement 2: Align Dependency Versions with Upstream

**User Story:** As a maintainer, I want the Fork's third-party dependencies aligned with upstream, so that the Fork benefits from bug fixes and security patches in those libraries.

#### Acceptance Criteria

1. THE Backend_Plugin `package.json` SHALL declare `@modelcontextprotocol/sdk` at version `^1.25.2` or later.
2. THE Backend_Plugin `package.json` SHALL declare `express` at version `^4.22.0` or later.
3. WHERE a Provider_Module depends on `@google/genai`, THE Provider_Module SHALL declare version `^1.41.0` or later.
4. WHERE a Provider_Module depends on `ollama`, THE Provider_Module SHALL declare version `^0.6.0` or later.
5. WHEN `yarn install` runs in `workspaces/mcp-chat`, THE Workspace SHALL complete without peer dependency conflicts.
6. WHEN `yarn tsc:full` runs in `workspaces/mcp-chat`, THE Workspace SHALL complete with exit code 0.

### Requirement 3: Align Backstage Framework Versions with Upstream

**User Story:** As a maintainer, I want the Fork to track the same Backstage framework version range as upstream, so that adopters do not encounter incompatibilities.

#### Acceptance Criteria

1. THE Backend_Plugin `package.json` SHALL declare `@backstage/backend-plugin-api` at version `^1.8.0` or later.
2. THE Frontend_Plugin `package.json` SHALL declare `@backstage/frontend-plugin-api` at version `^0.15.1` or later.
3. THE Frontend_Plugin `package.json` SHALL declare `@backstage/core-plugin-api` at version `^1.12.4` or later.
4. THE Backend_Plugin `backstage.role.supported-versions` field SHALL state `1.40.0` or later.
5. THE Frontend_Plugin `backstage.role.supported-versions` field SHALL state `1.40.0` or later.
6. WHEN `yarn tsc:full` runs in `workspaces/mcp-chat`, THE Workspace SHALL complete with exit code 0 against the updated framework versions.

### Requirement 4: Port Upstream Test Coverage Patterns

**User Story:** As a maintainer, I want the Fork's test suite to cover the same edge cases that upstream tests cover, so that regressions caught upstream are also caught in the Fork.

#### Acceptance Criteria

1. THE Node_Package SHALL contain a test file for the LLMProvider_Base class that verifies the `makeRequest` method throws a `ResponseError` on non-OK HTTP responses.
2. THE Node_Package SHALL contain a test file for the OpenAI_Compatible_Base class that verifies request header construction, request formatting, response parsing, and connection test status mapping for HTTP status codes 401, 403, 404, and 429.
3. THE Backend_Plugin SHALL contain a test file for the `SummarizationService` that verifies timeout fallback, disabled auto-summarize fallback, and title sanitization.
4. THE Backend_Plugin SHALL contain a test file for each Route_Module that exercises both success and error paths using the `supertest` library against the Express router.
5. THE Frontend_Plugin SHALL contain a test file for the `useConversations` hook that verifies guest user exclusion, optimistic delete rollback, and optimistic star toggle rollback.
6. Each test file SHALL import mocks or test utilities consistent with the testing patterns already used in the Fork (e.g., `@backstage/backend-test-utils` for backend, `@testing-library/react` for frontend).
7. WHEN `yarn test` runs against each added test path, THE Workspace SHALL complete with exit code 0.

### Requirement 5: Port Upstream Router Test Pattern

**User Story:** As a maintainer, I want the Fork's router integration test to cover the full route surface (status, chat, conversations), so that route mounting regressions are detected.

#### Acceptance Criteria

1. THE Backend_Plugin SHALL contain a router integration test that verifies `GET /provider/status` returns provider status JSON.
2. THE Backend_Plugin SHALL contain a router integration test that verifies `GET /mcp/status` returns MCP server status JSON.
3. THE Backend_Plugin SHALL contain a router integration test that verifies `GET /tools` returns the available tools list with a `toolCount` field.
4. THE Backend_Plugin SHALL contain a router integration test that verifies `POST /chat` with valid messages returns an assistant response with `content`, `toolResponses`, and `toolsUsed` fields.
5. THE Backend_Plugin SHALL contain a router integration test that verifies `POST /chat` with invalid messages returns HTTP 400.
6. THE Backend_Plugin SHALL contain a router integration test that verifies `GET /conversations` returns a conversations array for authenticated users.
7. THE Backend_Plugin SHALL contain a router integration test that verifies `DELETE /conversations/:id` returns HTTP 204 on success.
8. THE Backend_Plugin SHALL contain a router integration test that verifies `PATCH /conversations/:id/star` returns `isStarred` status.
9. THE Backend_Plugin SHALL contain a router integration test that verifies `PATCH /conversations/:id/title` returns the updated title.

### Requirement 6: Ensure Frontend API Client Uses ResponseError Consistently

**User Story:** As a maintainer, I want the frontend API client to construct errors through `ResponseError.fromResponse`, so that error metadata propagates to the UI hooks uniformly.

#### Acceptance Criteria

1. WHEN a `fetch` call in the Frontend_Plugin API client returns a non-OK response, THE API client SHALL construct the resulting error through `ResponseError.fromResponse` from `@backstage/errors`.
2. THE Frontend_Plugin `package.json` SHALL declare `@backstage/errors` in its dependency set.
3. THE Frontend_Plugin API client test file SHALL verify that a non-OK response results in a `ResponseError` instance.

### Requirement 7: Port Upstream Frontend Alpha Entry Point Improvements

**User Story:** As a maintainer, I want the Fork's alpha entry point to match the upstream structure, so that adopters switching from the upstream plugin can use the alpha path without adjustment.

#### Acceptance Criteria

1. THE Frontend_Plugin alpha entry point SHALL declare its chat page through `PageBlueprint.make` with a `path`, `title`, `icon`, `loader`, and `routeRef` parameter set.
2. THE Frontend_Plugin alpha entry point SHALL declare an `ApiBlueprint.make` extension for the MCP Chat API using `discoveryApiRef` and `fetchApiRef` as dependencies.
3. THE Frontend_Plugin alpha entry point SHALL use the `BotIconComponent` as the page icon rendered as JSX (matching upstream's `<BotIconComponent />`).
4. THE Frontend_Plugin alpha entry point SHALL export the plugin as a default export created via `createFrontendPlugin`.

### Requirement 8: Preserve Refactored Architecture Principles

**User Story:** As a maintainer, I want ported changes to respect the layered package boundaries, so that the refactor's single-responsibility guarantees remain intact.

#### Acceptance Criteria

1. THE Backend_Plugin SHALL continue to export its `createBackendPlugin` result as the sole entry of its public API.
2. THE Node_Package SHALL remain the single location for the LLMProvider_Base class and provider extension point.
3. WHERE a ported change touches provider logic, THE change SHALL be placed in the Node_Package or in the relevant Provider_Module, not in the Backend_Plugin.
4. WHERE a ported change touches contract types shared between frontend and backend, THE change SHALL be placed in the Common_Package.
5. THE ported changes SHALL NOT introduce new exports from the Backend_Plugin beyond the single plugin entry.

### Requirement 9: Verification Gates Pass

**User Story:** As a maintainer, I want the ported changes to satisfy the workspace verification gates, so that continuous integration passes on the first run.

#### Acceptance Criteria

1. WHEN `yarn tsc:full` runs in `workspaces/mcp-chat`, THE Workspace SHALL complete the command with exit code 0.
2. WHEN `yarn lint --fix` runs in `workspaces/mcp-chat`, THE Workspace SHALL complete the command with exit code 0.
3. WHEN `yarn test` runs against each added or changed test path, THE Workspace SHALL complete the command with exit code 0.
4. WHEN `yarn build:api-reports` runs in `workspaces/mcp-chat`, THE Workspace SHALL complete the command with exit code 0 and SHALL leave the committed API report files matching the generated output.
5. Each source file the sync adds SHALL begin with an Apache 2.0 copyright header stating the current year.
6. THE sync SHALL leave the copyright year of each pre-existing source file unchanged.
7. THE sync SHALL leave the ESLint, Prettier, and TypeScript configuration files of the Workspace unchanged.
