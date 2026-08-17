# Implementation Plan: Upstream Sync

## Overview

Port upstream improvements into the fork's layered 13-package architecture: replace plain `Error` throws with `ResponseError.fromResponse` in provider base classes, align dependency versions, and add missing test coverage. All work follows dependency order (package.json → install → node package → module → tests → verification) and runs from `workspaces/mcp-chat`.

## Tasks

- [x] 1. Update dependency versions in package.json files

  - [x] 1.1 Add `@backstage/errors` and bump `@backstage/backend-plugin-api` in mcp-chat-node

    - Add `"@backstage/errors": "^1.2.7"` to `dependencies` in `plugins/mcp-chat-node/package.json`
    - Bump `"@backstage/backend-plugin-api"` from `"^1.4.0"` to `"^1.8.0"`
    - _Requirements: 1.2, 2.6, 3.1_

  - [x] 1.2 Bump `@backstage/backend-plugin-api` in mcp-chat-backend

    - Bump `"@backstage/backend-plugin-api"` from `"^1.4.0"` to `"^1.8.0"` in `plugins/mcp-chat-backend/package.json`
    - _Requirements: 3.1_

  - [x] 1.3 Add `@backstage/errors` to mcp-chat-backend-module-openai-responses

    - Add `"@backstage/errors": "^1.2.7"` to `dependencies` in `plugins/mcp-chat-backend-module-openai-responses/package.json`
    - _Requirements: 1.4_

  - [x] 1.4 Run `yarn install` to resolve updated dependencies
    - Run from `workspaces/mcp-chat`
    - Verify no peer dependency conflicts
    - _Requirements: 2.5_

- [x] 2. Implement ResponseError integration in source files

  - [x] 2.1 Replace `throw new Error(...)` with `throw await ResponseError.fromResponse(response)` in LLMProvider.ts

    - File: `plugins/mcp-chat-node/src/LLMProvider.ts`
    - Import `ResponseError` from `@backstage/errors`
    - In the `makeRequest` method, replace the `if (!response.ok)` block: remove `response.text()` read and plain Error throw, replace with `throw await ResponseError.fromResponse(response)`
    - Keep the error-level log line but remove `responseData` field (body is now in the ResponseError)
    - _Requirements: 1.1, 1.3, 8.2, 8.3_

  - [x] 2.2 Replace `throw new Error(...)` with `throw await ResponseError.fromResponse(response)` in OpenAIResponsesProvider.ts
    - File: `plugins/mcp-chat-backend-module-openai-responses/src/OpenAIResponsesProvider.ts`
    - Import `ResponseError` from `@backstage/errors`
    - In the overridden `makeRequest` method, replace the non-OK error throw with `throw await ResponseError.fromResponse(response)`
    - Do NOT modify `testConnection()` — it returns `{ connected: false }` by design
    - _Requirements: 1.4, 8.3_

- [x] 3. Checkpoint - Verify compilation

  - Ensure `yarn tsc:full` passes from `workspaces/mcp-chat`, ask the user if questions arise.

- [x] 4. Add and update test files

  - [x] 4.1 Create `LLMProvider.test.ts` in the node package

    - File: `plugins/mcp-chat-node/src/LLMProvider.test.ts`
    - Create a concrete test subclass of LLMProvider (implement abstract methods)
    - Mock `global.fetch` to return non-OK responses (400, 401, 500)
    - Assert that `makeRequest` throws a `ResponseError` instance with correct status code
    - Test the happy path: mock 200 response with JSON body, verify parsed result
    - Use `@backstage/errors` to import `ResponseError` for `instanceof` checks
    - _Requirements: 4.1, 9.3, 9.5_

  - [x] 4.2 Update `OpenAICompatibleBase.test.ts` with connection error mapping tests

    - File: `plugins/mcp-chat-node/src/OpenAICompatibleBase.test.ts`
    - Add tests for `testConnection()` returning `{ connected: false, error }` on HTTP 401, 403, 404, 429
    - Verify the error message maps correctly for each status code
    - _Requirements: 4.2_

  - [x] 4.3 Update `OpenAIResponsesProvider.test.ts` to assert ResponseError

    - File: `plugins/mcp-chat-backend-module-openai-responses/src/OpenAIResponsesProvider.test.ts`
    - Update or add test case: when `makeRequest` gets a non-OK response, it throws `ResponseError`
    - Verify the ResponseError carries the HTTP status code from the mock response
    - _Requirements: 4.1, 1.4, 1.5_

  - [x] 4.4 Create `useConversations.test.tsx` in the frontend plugin
    - File: `plugins/mcp-chat/src/hooks/useConversations.test.tsx`
    - Test guest user exclusion: when auth returns a guest principal, conversations are not fetched
    - Test optimistic delete rollback: UI updates immediately, then rolls back on server error
    - Test optimistic star toggle rollback: star toggles immediately, rolls back on error
    - Use `@testing-library/react` with `renderHook` and `@backstage/test-utils` mock APIs
    - _Requirements: 4.5, 4.6, 4.7, 9.3_

- [x] 5. Checkpoint - Run targeted tests

  - Ensure all tests pass by running `yarn test` against each added/modified test path, ask the user if questions arise.

- [x] 6. Final verification gates

  - [x] 6.1 Run `yarn tsc:full` and `yarn lint --fix`

    - Verify both exit with code 0 from `workspaces/mcp-chat`
    - _Requirements: 9.1, 9.2_

  - [x] 6.2 Run `yarn build:api-reports`

    - Verify exit code 0 and that generated API report files match committed state
    - _Requirements: 9.4_

  - [x] 6.3 Verify copyright headers and configuration files unchanged
    - New source files must have Apache 2.0 header with current year (2025)
    - Pre-existing file headers must not be modified
    - ESLint, Prettier, TypeScript configs must remain untouched
    - _Requirements: 9.5, 9.6, 9.7_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The design confirms no PBT (property-based testing) is applicable — all changes are finite and deterministic
- Frontend API client and alpha entry point already match upstream (no code changes needed per design)
- Router integration tests already comprehensive (30+ test cases) — no new router tests needed
- All commands run from `workspaces/mcp-chat`, never from the repository root

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4"] },
    { "id": 2, "tasks": ["2.1", "2.2"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3", "4.4"] },
    { "id": 4, "tasks": ["6.1", "6.2", "6.3"] }
  ]
}
```
