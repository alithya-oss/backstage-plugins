Requirement references are to `specs/mcp-chat/prompt-page/spec.md`. All commands
run from `workspaces/mcp-chat` unless stated otherwise.

## 1. Dependencies, route and page wiring

Covers _Page availability alongside the existing chat page_.

- [ ] 1.1 Add `@assistant-ui/react@0.15.16` and `@remixicon/react` to
      `plugins/mcp-chat/package.json` dependencies, and narrow the `react`,
      `react-dom` and `@types/react` peer ranges from `^17.0.0 || ^18.0.0` to
      `^18`. Verify with `yarn install` reporting no unmet peer warning for
      `@assistant-ui/react`.
- [ ] 1.2 Run `yarn dedupe` and commit the resulting `yarn.lock`. Verify
      `yarn dedupe --check` exits zero — this is what CI gates on, and it must
      pass before any `tsc` result is trusted.
- [ ] 1.3 Add `promptRouteRef` to `plugins/mcp-chat/src/routes.ts` and export it
      from `src/wiring.ts` alongside a lazy loader for the new page, following the
      existing `chatPageContentLoader` pattern. Verify `yarn tsc:full` passes.
- [ ] 1.4 Add a second `PageBlueprint` to `plugins/mcp-chat/src/alpha.tsx` bound
      to `promptRouteRef`, register it in the plugin's `extensions` and `routes`,
      and leave the existing `mcpChatPage` untouched. Verify by extending
      `src/alpha.test.tsx` so it asserts both pages render at their own paths —
      this covers the scenarios _Both pages are reachable_ and _The new page is
      not mounted_.

## 2. External store adapter and message conversion

Covers _Prompt submission_, _Run lifecycle and completion_, _Provider and
transport error handling_ (state layer).

- [ ] 2.1 Add a `usePromptThread` hook holding the turn list, the active
      `conversationId`, the in-flight `AbortController` and the running flag.
      Verify with unit tests asserting a submitted prompt is appended and a blank
      prompt is not — scenarios _A prompt is submitted_ and _An empty prompt is
      rejected_.
- [ ] 2.2 Implement `convertMessage`, mapping a view-model turn to
      `ThreadMessageLike`: the reply as a `text` part, and each
      `ToolExecutionResult` as a `tool-call` part (`id` → `toolCallId`, `name` →
      `toolName`, `arguments` → `args`, `result` → `result`), with `isError`
      derived in a single named helper as `design.md` requires. Verify with unit
      tests over a reply with zero, one and several tool results.
- [ ] 2.3 Implement `onNew`: append the user turn, call
      `mcpChatApi.sendChatMessage` with the full prior conversation, the enabled
      server ids, the abort signal and the active `conversationId`, then append
      the assistant turn and record the returned `conversationId`. Verify with a
      test asserting the enabled-server ids reach the API — scenario _A prompt is
      submitted_.
- [ ] 2.4 Implement `onCancel` — abort the in-flight request, clear the running
      flag, and hand the trimmed list back through `setMessages` so the removal
      survives the next snapshot. Verify with a test asserting no assistant turn
      is appended and no trailing user turn is left — scenario _A run is
      cancelled_.
- [ ] 2.5 Guard against concurrent runs so a submit during an active run does not
      interleave two runs. Verify with a test — scenario _A prompt is submitted
      while a run is active_.
- [ ] 2.6 Map failures to error state rather than assistant content, keeping the
      prompt recoverable and distinguishing an unreachable backend from a
      provider rejection. Verify with tests over both failure shapes and a
      successful retry — scenarios _The chat provider returns an error_, _The
      backend is unreachable_, _A retry succeeds after a failure_.
- [ ] 2.7 Assemble the `ExternalStoreAdapter` and pass it to
      `useExternalStoreRuntime` with exactly the handler set `design.md` fixes —
      `messages`, `convertMessage`, `isRunning`, `isLoading`, `onNew`,
      `setMessages`, `onEdit`, `onReload`, `onCancel` — leaving
      `unstable_enableToolInvocations` at its `false` default and omitting
      `onAddToolResult` and `adapters.threadList`. Verify `yarn tsc:full` passes
      with no `unstable_` or deprecated member referenced.

## 3. Thread surface

Covers _Prompt submission_, _Run lifecycle and completion_, _Provider and
transport error handling_ (presentation).

- [ ] 3.1 Build the composer from `ComposerPrimitive` with multi-line input,
      submit-on-Enter and newline-on-Shift-Enter, styled with a CSS module over
      BUI tokens. Verify with a test driving `screen` queries and `findBy*` —
      scenario _A prompt is submitted_.
- [ ] 3.2 Build the message list and viewport from `ThreadPrimitive` and
      `MessagePrimitive`, rendering assistant text as markdown. Verify with a test
      asserting a completed reply renders as formatted text — scenario _A run
      completes successfully_.
- [ ] 3.3 Render the running indicator and the cancel control from the runtime's
      running state. Verify with a test asserting both appear while a run is in
      flight and clear afterwards — scenario _A run is in progress_.
- [ ] 3.4 Render run failures as an error distinct from assistant content, with a
      retry control. Verify with a test — scenarios _The chat provider returns an
      error_ and _The backend is unreachable_.
- [ ] 3.5 Confirm no file added under `src/components/PromptPage` imports
      `@backstage/core-components`, `@mui/material` or `@mui/icons-material`.
      Verify with `grep` over the new directory and with `yarn lint --fix`
      reporting clean.

## 4. MCP tool call rendering

Covers _MCP tool call rendering_.

- [ ] 4.1 Register one catch-all tool UI via `makeAssistantToolUI` rendering a
      tool-call part's name collapsed by default, expandable to its arguments and
      result, in BUI with `@remixicon/react` icons. Verify with tests over one and
      several invocations, asserting independent expansion — scenarios _A single
      tool is invoked_ and _Several tools are invoked in one turn_.
- [ ] 4.2 Add the copy affordance for an expanded result, with acknowledgement.
      Verify with a test asserting the clipboard write and the acknowledgement —
      scenario _A tool result is copied_.
- [ ] 4.3 Style a failed invocation distinctly and expose its error detail on
      expansion. Verify with a test — scenario _A tool invocation fails_.
- [ ] 4.4 Verify a reply with no tool results renders no tool-call section, with a
      test — scenario _No tool is invoked_.

## 5. Revising and regenerating

Covers _Revising and regenerating turns_.

- [ ] 5.1 Implement `onEdit` — truncate the list to the edited user turn and
      re-run from its new text — and surface it through the message action bar and
      edit composer primitives. Verify with a test — scenario _A user turn is
      edited and re-run_.
- [ ] 5.2 Implement `onReload` for the latest user turn and surface a regenerate
      action. Verify with a test asserting a second answer is produced for the
      same prompt — scenario _An answer is regenerated_.
- [ ] 5.3 Render `BranchPickerPrimitive` so a turn with several answers shows its
      position and allows moving between them, keeping `setMessages` wired so a
      switch survives the next snapshot. Verify with a test — scenario _Moving
      between alternative answers_.

## 6. Reduced side panel

Covers _MCP server selection and provider status_ and _Selecting an existing
conversation_.

- [ ] 6.1 Build the MCP server toggle list on `useMcpServers`, feeding the enabled
      ids into the adapter's run parameters, without reusing the Material UI
      `ActiveMcpServers` view. Verify with a test asserting a disabled server's id
      is absent from the next request — scenario _A server is disabled_.
- [ ] 6.2 Build the read-only provider status block on `useProviderStatus`,
      showing connection state and reported model name with no control to change
      them, and reporting unavailability without blocking the composer. Verify
      with tests — scenarios _Provider status is shown_ and _Provider status
      cannot be loaded_.
- [ ] 6.3 Build the conversation list on `useConversations`, ordered most recently
      updated first, with pinned conversations grouped ahead of the rest. Selecting
      one calls `loadConversation` and pushes its turns and id into the thread
      state; "new conversation" clears both. Verify with tests — scenarios _An
      existing conversation is selected_ and _A fresh conversation is started_.
- [ ] 6.4 Wire the search field to `useConversations`' `searchQuery`. Verify with a
      test asserting case-insensitive narrowing over titles and user turns —
      scenario _The list is searched_.
- [ ] 6.5 Wire pin and delete to `toggleStar` and `deleteConversation`, including
      the rollback-and-inform path on a failed delete. Verify with tests —
      scenarios _A conversation is pinned_ and _A conversation is deleted_.
- [ ] 6.6 Handle the empty and non-owning-identity cases so the panel reports an
      empty list without an error and the composer still accepts a prompt. Verify
      with a test — scenario _The user has no stored conversations_.

## 7. Workspace verification and release artifacts

- [ ] 7.1 Re-run `yarn dedupe`, then `CI=true yarn test` and `yarn tsc:full`, in
      that order, and confirm all three pass. Order matters: dedupe rewrites
      resolved versions, so earlier test and type results do not carry over.
- [ ] 7.2 Run `yarn lint --fix` and `yarn prettier --write` over the changed
      paths, and confirm every new `.ts`/`.tsx` file carries the Apache 2.0
      header with the current year, without touching the year on existing files.
- [ ] 7.3 Run `yarn build:api-reports` and commit the updated report, since
      `src/wiring.ts` and `src/alpha.tsx` gain public exports.
- [ ] 7.4 Add a changeset for `@alithya-oss/backstage-plugin-mcp-chat` describing
      the new page for adopters and calling out the narrowed React peer range as a
      breaking change with its migration note.
- [ ] 7.5 Confirm the diff touches no backend package and none of
      `src/api/McpChatApi.ts`, `src/types.ts`, `src/components/ChatContainer/**`,
      `src/components/RightPane/**` or `src/components/ChatPage/**`. Verify with
      `git diff --stat`.
