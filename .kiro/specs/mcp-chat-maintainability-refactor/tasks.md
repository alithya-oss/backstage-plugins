# Implementation Plan: mcp-chat Maintainability Refactor

## Overview

Restructure the `workspaces/mcp-chat` workspace into a clean layered architecture following the Backstage new backend/frontend system conventions. The refactor proceeds in strict build-order: common → node → provider modules → backend → frontend → verification. Each step keeps `yarn tsc:full` green.

## Tasks

- [x] 1. Common package — strip to browser-safe contract types only

  - [x] 1.1 Remove `LLMProvider` class export and its source file from the common package

    - Remove the `LLMProvider` class from `plugins/mcp-chat-common/src/base-provider.ts` (or move its content to node package in step 2)
    - Update `plugins/mcp-chat-common/src/index.ts` to remove the `LLMProvider` re-export
    - Ensure only Contract_Types (interfaces, enums, type aliases) remain exported
    - _Requirements: 1.1, 1.4_

  - [x] 1.2 Remove `@backstage/backend-plugin-api` from common package dependencies

    - Edit `plugins/mcp-chat-common/package.json` to remove `@backstage/backend-plugin-api` from `dependencies`
    - Remove any import of `LoggerService` or other backend-plugin-api symbols from common source files
    - _Requirements: 1.2, 1.5_

  - [x] 1.3 Clean up dead imports and verify common package compiles
    - Remove any remaining imports that reference the removed class or backend dependency
    - Ensure all type references resolve through top-level import statements
    - Run `yarn tsc` within the common package to confirm it compiles
    - _Requirements: 1.3, 1.6_

- [x] 2. Node package — establish single provider extension surface

  - [x] 2.1 Add `LLMProvider.ts` abstract base class to the node package

    - Create `plugins/mcp-chat-node/src/LLMProvider.ts` with the abstract class moved from common
    - The class owns `fetch` usage and accepts a `LoggerService` instance
    - Export from `plugins/mcp-chat-node/src/index.ts`
    - _Requirements: 2.1, 1.4_

  - [x] 2.2 Add `OpenAICompatibleBase.ts` shared implementation

    - Create `plugins/mcp-chat-node/src/OpenAICompatibleBase.ts` per the design (Section 4)
    - Implement `sendMessage`, `testConnection`, `getHeaders`, `formatRequest`, `parseResponse`, `mapConnectionError`
    - Export from `plugins/mcp-chat-node/src/index.ts`
    - _Requirements: 5.1, 5.2, 5.5_

  - [x] 2.3 Add `createLlmProviderModule.ts` factory function

    - Create `plugins/mcp-chat-node/src/createLlmProviderModule.ts` per the design (Section 3)
    - Accept `CreateLlmProviderModuleOptions` (providerId, defaultBaseUrl, providerFactory)
    - Read config from `mcpChat.providers[]`, apply defaults, register through extension point
    - Export from `plugins/mcp-chat-node/src/index.ts`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.4 Create extended `ProviderConfig` type with `logger` field

    - Rewrite `plugins/mcp-chat-node/src/types.ts` with the extended `ProviderConfig` type that includes `logger: LoggerService`
    - Re-export all common types that provider modules need (ChatMessage, ChatResponse, Tool, etc.)
    - Export from `plugins/mcp-chat-node/src/index.ts`
    - _Requirements: 2.3, 2.4_

  - [x] 2.5 Delete dead files and update node package index

    - Delete `plugins/mcp-chat-node/src/base-provider.ts` (dead re-export shim)
    - Delete old `plugins/mcp-chat-node/src/types.ts` if not already rewritten
    - Update `plugins/mcp-chat-node/src/index.ts` to export all new declarations
    - _Requirements: 2.5_

  - [x] 2.6 Add `fast-check` as a devDependency to packages with property tests

    - Add `fast-check` to `devDependencies` in `plugins/mcp-chat-node/package.json`
    - Add `fast-check` to `devDependencies` in `plugins/mcp-chat-backend/package.json`
    - Run `yarn install` from `workspaces/mcp-chat` (NOT from the repository root)
    - _Requirements: 11.3_

  - [x] 2.7 Write property tests for `createLlmProviderModule`

    - **Property 1: Factory module registration**
    - **Property 2: Factory default base URL fallback**
    - **Property 3: Factory maxTokens and temperature propagation**
    - Create `plugins/mcp-chat-node/src/createLlmProviderModule.test.ts`
    - Use `fast-check` for input generation, minimum 100 iterations
    - **Validates: Requirements 4.1, 4.3, 4.4, 4.5**

  - [x] 2.8 Write property tests for `OpenAICompatibleBase`
    - **Property 4: OpenAI-compatible base formats requests with config values**
    - **Property 5: OpenAI-compatible base includes authorization header**
    - Create `plugins/mcp-chat-node/src/OpenAICompatibleBase.test.ts`
    - Use `fast-check` for input generation, minimum 100 iterations
    - **Validates: Requirements 5.1, 5.5**

- [x] 3. Checkpoint — common and node packages compile

  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Provider modules — switch all 9 to `createLlmProviderModule`

  - [x] 4.1 Refactor OpenAI-compatible provider modules (openai, litellm, agentgateway, azure-openai)

    - Rewrite each `src/module.ts` to call `createLlmProviderModule` (~20 lines)
    - Switch provider classes to extend `OpenAICompatibleBase` from node package
    - Remove unused `readAuthRecord` helper from each module
    - Override vendor-specific members: OpenAI (`formatRequest`), AgentGateway (`formatRequest`), AzureOpenAI (`getHeaders`, `formatRequest`), LiteLLM (none)
    - Update `package.json` dependencies: add `@backstage-community/plugin-mcp-chat-node`, remove direct backend-plugin dependency if redundant
    - Ensure each module has a `src/configSchema.ts` (or `config.d.ts` declaration) covering the configuration keys that specific provider reads
    - _Requirements: 4.6, 4.7, 4.8, 5.3, 5.4_

  - [x] 4.2 Refactor non-OpenAI provider modules (anthropic, amazon-bedrock, gemini, ollama, openai-responses)

    - Rewrite each `src/module.ts` to call `createLlmProviderModule` (~20 lines)
    - Ensure provider classes extend `LLMProvider` directly from node package
    - Remove unused `readAuthRecord` helper from each module
    - Update `package.json` dependencies: add `@backstage-community/plugin-mcp-chat-node`, remove direct backend-plugin dependency if redundant
    - Ensure each module has a `src/configSchema.ts` (or `config.d.ts` declaration) covering the configuration keys that specific provider reads
    - _Requirements: 4.6, 4.7, 4.8_

  - [x] 4.3 Add module registration tests for all 9 provider modules

    - Create `src/module.test.ts` in each provider module package
    - Test that the module calls `registerProvider` on the extension point when config is present
    - Test that the module skips silently when config entry is absent
    - _Requirements: 11.1_

  - [x] 4.4 Relocate and update OpenAI provider test
    - Move `plugins/mcp-chat-backend/src/providers/openai-provider.test.ts` to `plugins/mcp-chat-backend-module-openai/src/OpenAIProvider.test.ts`
    - Update imports to reference node package exports
    - _Requirements: 11.1_

- [x] 5. Checkpoint — all provider modules compile and register correctly

  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Backend plugin — reduce public API and decompose internals

  - [x] 6.1 Delete re-export shims, reduce `index.ts` to single default export, and fix dependency placement

    - Delete `plugins/mcp-chat-backend/src/extensions.ts`
    - Delete `plugins/mcp-chat-backend/src/providers/index.ts`
    - Delete `plugins/mcp-chat-backend/src/providers/` directory (empty after relocations)
    - Update `plugins/mcp-chat-backend/src/index.ts` to export only the `mcpChatPlugin` default
    - Move `@backstage/backend-defaults` and `@backstage/plugin-catalog-node` from `dependencies` to `devDependencies` in `plugins/mcp-chat-backend/package.json` (they are only consumed in `dev/index.ts`)
    - Verify that the backend plugin calls `env.registerExtensionPoint(llmProviderExtensionPoint, impl)` BEFORE `env.registerInit(...)` in the plugin definition
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

  - [x] 6.2 Decompose `MCPClientServiceImpl.ts` into service units

    - Create `plugins/mcp-chat-backend/src/services/McpServerLifecycle.ts` (~250 lines)
    - Create `plugins/mcp-chat-backend/src/services/McpTransportFactory.ts` (~80 lines)
    - Create `plugins/mcp-chat-backend/src/services/QueryProcessor.ts` (~180 lines)
    - Create `plugins/mcp-chat-backend/src/services/ProviderStatusReporter.ts` (~50 lines)
    - Create `plugins/mcp-chat-backend/src/services/McpServerStatusReporter.ts` (~40 lines)
    - Create `plugins/mcp-chat-backend/src/services/types.ts` with named transport option types
    - Reduce `MCPClientServiceImpl` to a thin facade delegating to the new units
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 6.3 Decompose `utils.ts` into per-concern modules

    - Create `plugins/mcp-chat-backend/src/utils/loadServerConfigs.ts`
    - Create `plugins/mcp-chat-backend/src/utils/validateConfig.ts`
    - Create `plugins/mcp-chat-backend/src/utils/findNpxPath.ts`
    - Create `plugins/mcp-chat-backend/src/utils/executeToolCall.ts`
    - Create `plugins/mcp-chat-backend/src/utils/validateMessages.ts`
    - Create `plugins/mcp-chat-backend/src/utils/isGuestUser.ts`
    - Create `plugins/mcp-chat-backend/src/utils/index.ts` barrel export
    - Replace `console.log`/`console.warn` with injected `LoggerService` parameter
    - _Requirements: 6.5, 6.6, 6.7_

  - [x] 6.4 Add error middleware and typed error handling to routes

    - Register `MiddlewareFactory.create({ config, logger }).error()` as final middleware in `createRouter`
    - Replace inline `res.status(...).json(...)` error returns with thrown `@backstage/errors` types (InputError, NotFoundError, NotAllowedError)
    - Replace `error?.message?.includes('no such table')` with typed `isMissingTableError` function
    - Preserve all status codes and response body shapes per the design Section 7 table
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 6.5 Write unit tests for decomposed service units

    - Create test files for McpServerLifecycle, McpTransportFactory, QueryProcessor, ProviderStatusReporter, McpServerStatusReporter
    - Use mock services and verify delegation behavior
    - _Requirements: 11.4_

  - [x] 6.6 Write unit tests for decomposed utility modules

    - Create test files for loadServerConfigs, validateConfig, findNpxPath, executeToolCall, validateMessages, isGuestUser
    - **Property 6: Utility functions emit diagnostics through injected logger**
    - Verify logger injection replaces console calls
    - **Validates: Requirements 6.7, 11.4**

  - [x] 6.7 Write route integration tests
    - **Property 7: Route handlers throw @backstage/errors types on failure**
    - **Property 8: Backend route paths preserved**
    - Use `supertest` with mock services
    - Validate status code and response body per Section 7 table
    - **Validates: Requirements 7.2, 7.5, 11.2, 12.1**

- [x] 7. Checkpoint — backend plugin compiles with reduced API

  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Frontend plugin — wiring module and component decomposition

  - [x] 8.1 Create `src/wiring.ts` shared frontend wiring module

    - Create `plugins/mcp-chat/src/wiring.ts` with `rootRouteRef` (no id arg), API factory ref, and `chatPageLoader`
    - Use `createRouteRef` from `@backstage/frontend-plugin-api`
    - _Requirements: 8.1, 8.4_

  - [x] 8.2 Refactor `plugin.ts` (legacy entry point) to source from wiring

    - Import `rootRouteRef`, `mcpChatApiRef`, `McpChat`, `chatPageLoader` from `./wiring`
    - Remove duplicate definitions
    - _Requirements: 8.2, 8.7_

  - [x] 8.3 Refactor `alpha.tsx` (alpha entry point) to source from wiring

    - Import shared refs from `./wiring`
    - Declare `ApiBlueprint`, `PageBlueprint` extensions per design Section 8.3
    - _Requirements: 8.3, 8.5, 8.6, 8.7_

  - [x] 8.4 Switch frontend imports to `@backstage/frontend-plugin-api`

    - Replace `useApi` and `configApiRef` imports from `@backstage/core-plugin-api` with `@backstage/frontend-plugin-api`
    - Import Contract_Types from `@backstage-community/plugin-mcp-chat-common`
    - Declare local view-model types as extensions of common Contract_Types
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 8.5 Factor out inner chat page content and conditionally apply `Page`/`Content` wrapper

    - Extract the inner content of the chat page loader into a shared `ChatPageContent` component (no `<Page>` or `<Content>` wrapper)
    - In the alpha entry point (`PageBlueprint` path), render `ChatPageContent` directly — `PageBlueprint` provides the page shell
    - In the legacy entry point (`createRoutableExtension` path), wrap `ChatPageContent` with `<Page themeId="tool"><Content noPadding>...</Content></Page>` as currently required
    - Ensure `ResponseError.fromResponse` is used for non-OK fetch responses
    - Expose hook errors as `Error` instances, present without wrapping
    - _Requirements: 9.4, 9.5, 9.6, 9.7_

  - [x] 8.6 Decompose `ChatMessage.tsx` (507 lines → ≤250 each)

    - Create `plugins/mcp-chat/src/components/ChatContainer/useChatMessage.ts` (state hook)
    - Create `plugins/mcp-chat/src/components/ChatContainer/ChatMessageView.tsx` (presentation)
    - Create `plugins/mcp-chat/src/components/ChatContainer/ToolCallDetails.tsx` (collapsible tool display)
    - Use existing styling mechanism (`useTheme()` + `sx` prop)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 8.7 Decompose `RightPane.tsx` (370 lines → ≤250 each)

    - Create `plugins/mcp-chat/src/components/RightPane/useRightPane.ts` (state hook)
    - Create `plugins/mcp-chat/src/components/RightPane/RightPaneView.tsx` (presentation)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 8.8 Decompose `ChatContainer.tsx` (358 lines → ≤250 each)

    - Create `plugins/mcp-chat/src/components/ChatContainer/useChatContainer.ts` (state hook)
    - Create `plugins/mcp-chat/src/components/ChatContainer/ChatContainerView.tsx` (presentation)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 8.9 Write component tests for decomposed frontend units
    - **Property 9: Frontend hooks expose Error instances**
    - Test ChatContainerView, ChatMessageView, RightPaneView, BotIcon, useConversations hook
    - Use `screen` + `findBy*` queries, no `data-testid` attributes added
    - **Validates: Requirements 9.6, 11.5, 11.6, 11.7, 11.8**

- [x] 9. Checkpoint — frontend plugin compiles and renders correctly

  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Verification and release artifacts

  - [x] 10.1 Run full verification pipeline

    - Run `yarn tsc:full` from `workspaces/mcp-chat` — exit code 0
    - Run `yarn lint --fix` from `workspaces/mcp-chat` — exit code 0
    - Run `CI=true yarn test` against each added or changed test path — exit code 0
    - Run `yarn build:api-reports` — exit code 0, reports match generated output
    - Run `yarn build:knip-reports` — exit code 0, reports match generated output
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 10.2 Verify copyright headers and configuration files unchanged

    - Ensure all new `.ts`/`.tsx` files have Apache 2.0 copyright header with current year
    - Ensure existing file copyright years are unchanged
    - Ensure ESLint, Prettier, and TypeScript config files are unmodified
    - _Requirements: 13.6, 13.7, 13.8_

  - [x] 10.3 Create changesets for all affected packages
    - `@backstage-community/plugin-mcp-chat-common` — **major**: removed LLMProvider, removed backend-plugin-api dep
    - `@backstage-community/plugin-mcp-chat-node` — **major**: exports LLMProvider, OpenAICompatibleBase, createLlmProviderModule; removed dead files
    - `@backstage-community/plugin-mcp-chat-backend` — **major**: public API reduced to single default export
    - `@backstage-community/plugin-mcp-chat` — **minor**: added /alpha entry point, internal decomposition
    - Each provider module (×9) — **minor**: switched to createLlmProviderModule, removed readAuthRecord
    - Each changeset states removed/relocated declarations, new locations, and adopter migration steps
    - _Requirements: 12.4, 12.5_

- [x] 11. Final checkpoint — CI-ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each layer
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All commands run from `workspaces/mcp-chat`, never from the repository root
- Steps 1–3 (common + node + provider modules) should ideally land in one atomic PR to avoid transient breakage
- The design's Section 12 specifies strict build-order: common → node → providers → backend → frontend → verification

### Atomicity Strategy

Steps 1–4 (common package, node package, provider modules, and their tests) MUST be implemented as a single logical unit and committed together. Do NOT commit between steps 1 and 4's completion. This ensures `yarn tsc:full` never sees a broken intermediate state where, for example, the common package has removed `LLMProvider` but the node package has not yet added it. The individual tasks within steps 1–4 remain separate for clarity and parallelization within a wave, but the working tree should not be committed until all of steps 1–4 pass `yarn tsc:full` together.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["2.4"] },
    { "id": 3, "tasks": ["2.1", "2.5"] },
    { "id": 4, "tasks": ["2.2", "2.3", "2.6"] },
    { "id": 5, "tasks": ["2.7", "2.8"] },
    { "id": 6, "tasks": ["4.1", "4.2"] },
    { "id": 7, "tasks": ["4.3", "4.4"] },
    { "id": 8, "tasks": ["6.1"] },
    { "id": 9, "tasks": ["6.2", "6.3"] },
    { "id": 10, "tasks": ["6.4"] },
    { "id": 11, "tasks": ["6.5", "6.6", "6.7"] },
    { "id": 12, "tasks": ["8.1"] },
    { "id": 13, "tasks": ["8.2", "8.3", "8.4"] },
    { "id": 14, "tasks": ["8.5", "8.6", "8.7", "8.8"] },
    { "id": 15, "tasks": ["8.9"] },
    { "id": 16, "tasks": ["10.1", "10.2"] },
    { "id": 17, "tasks": ["10.3"] }
  ]
}
```
