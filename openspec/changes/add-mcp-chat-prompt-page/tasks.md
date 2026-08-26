Requirement references are to `specs/mcp-chat/prompt-page/spec.md` and
`specs/mcp-chat/chat-streaming/spec.md`. All commands run from
`workspaces/mcp-chat` unless stated otherwise.

Groups 1 and 2 are backend work and gate the frontend streaming groups: build the
endpoint before the page that consumes it.

## 1. Provider streaming seam

Covers _Providers without native streaming_.

- [x] 1.1 Add shared stream event payload types to `plugins/mcp-chat-common`
      (text fragment, tool-call, tool-result, terminal completion, terminal
      failure) plus a streaming capability flag on provider status, so backend and
      frontend cannot drift. Verify with `yarn tsc:full`.
- [x] 1.2 Add a **concrete** `streamMessage` to the `LLMProvider` base class in
      `plugins/mcp-chat-node`, defaulting to awaiting the existing `sendMessage`
      and emitting the whole reply as one fragment, plus `supportsStreaming()`
      returning `false`. Do **not** make either abstract. Verify that all nine
      `mcp-chat-backend-module-*` packages still typecheck untouched with
      `yarn tsc:full` — that is the whole point of the default implementation.
- [x] 1.3 Surface `supportsStreaming()` on the provider status payload. Verify with
      a test — scenario _Streaming capability is reported_.
- [x] 1.4 Add tests proving the fallback path yields exactly one fragment then the
      terminal event — scenario _A provider does not stream natively_.

## 2. Streaming chat endpoint

Covers _Streaming chat endpoint_, _Stream event sequence_, _Cancellation and
disconnection_, _Authorization and persistence parity_.

- [x] 2.1 Factor the parts of `QueryProcessor.processQuery` both paths need —
      system-prompt injection and tool filtering by enabled server id — into
      helpers, so the streaming variant reuses them instead of copying. Verify
      existing tests still pass unchanged.
- [x] 2.2 Add a streaming query path emitting a text event per provider fragment,
      a tool-call event before each MCP invocation and a tool-result event after
      it, correlated by invocation id, then exactly one terminal event. Verify with
      tests — scenarios _A reply is streamed without tools_, _A tool is invoked
      mid-run_, _A tool invocation fails_.
- [x] 2.3 Add the `POST /chat/stream` route emitting `text/event-stream` with
      no-buffering headers, validating the body exactly as `POST /chat` does before
      opening the stream. Verify with tests — scenarios _A streaming request is
      accepted_ and _The request is invalid_.
- [x] 2.4 Tie an `AbortController` to client disconnect: abandon the provider
      request, start no further tool invocation, and persist nothing for the
      cancelled run. Verify with tests — scenarios _The client disconnects
      mid-stream_ and _A cancelled run is not stored_.
- [x] 2.5 Apply the same credentials and persistence rules as `POST /chat`,
      including guest skipping and title generation for a new conversation, and
      keep a persistence failure from failing the run. Verify with tests —
      scenarios _An authenticated user streams a reply_, _A guest user streams a
      reply_, _Persistence fails_.
- [x] 2.6 Confirm `POST /chat` is untouched and still passes its existing tests —
      scenario _The non-streaming endpoint is unaffected_. Verify with
      `git diff` on `chatRoutes.ts` showing only additive changes.
- [x] 2.7 Add a changeset for each backend package touched
      (`mcp-chat-backend`, `mcp-chat-node`, `mcp-chat-common`) describing the new
      endpoint and the provider seam for adopters.

## 3. Dependencies, route and page wiring

Covers _Page availability alongside the existing chat page_.

- [x] 3.1 Add `@assistant-ui/react@0.15.16` and `@remixicon/react` to
      `plugins/mcp-chat/package.json` dependencies, and narrow the `react`,
      `react-dom` and `@types/react` peer ranges from `^17.0.0 || ^18.0.0` to
      `^18`. Verify with `yarn install` reporting no unmet peer warning for
      `@assistant-ui/react`.
- [x] 3.2 Run `yarn dedupe` and commit the resulting `yarn.lock`. Verify
      `yarn dedupe --check` exits zero — this is what CI gates on, and it must
      pass before any `tsc` result is trusted.
- [x] 3.3 Add `promptRouteRef` to `plugins/mcp-chat/src/routes.ts` and export it
      from `src/wiring.ts` alongside a lazy loader for the new page, following the
      existing `chatPageContentLoader` pattern. Verify `yarn tsc:full` passes.
- [x] 3.4 Add a second `PageBlueprint` to `plugins/mcp-chat/src/alpha.tsx` bound
      to `promptRouteRef`, register it in the plugin's `extensions` and `routes`,
      and leave the existing `mcpChatPage` untouched. Verify by extending
      `src/alpha.test.tsx` so it asserts both pages render at their own paths —
      this covers the scenarios _Both pages are reachable_ and _The new page is
      not mounted_.

## 4. Streaming client and external store adapter

Covers _Prompt submission_, _Run lifecycle and streamed completion_, _Provider and
transport error handling_ (state layer).

- [x] 4.1 Add a streaming method to `src/api/McpChatApi.ts` that posts to
      `/chat/stream`, parses the event stream, and surfaces typed events to the
      caller, accepting an `AbortSignal`. Leave `sendChatMessage` and every other
      existing method untouched. Verify with tests over a well-formed stream, a
      stream ending in failure, and an aborted stream.
- [x] 4.2 Add a `usePromptThread` hook holding the turn list, the active
      `conversationId`, the in-flight `AbortController` and the running flag.
      Verify with unit tests asserting a submitted prompt is appended and a blank
      prompt is not — scenarios _A prompt is submitted_ and _An empty prompt is
      rejected_.
- [x] 4.3 Implement `convertMessage` to `ThreadMessageLike`, mapping accumulated
      text to a `text` part and each invocation to a `tool-call` part keyed by
      `toolCallId`, with `isError` read from the tool-result event. Set `status` to
      `running` while fragments arrive, `complete` on success, and `incomplete`
      with reason `error` or `cancelled` otherwise. Verify with unit tests over
      each state.
- [x] 4.4 Implement `onNew`: append the user turn, open the stream with the full
      prior conversation, the enabled server ids, the abort signal and the active
      `conversationId`, then apply each event to state — appending fragments,
      inserting a tool-call part on its start event and filling it in place on its
      result event. Verify with tests — scenarios _A reply renders incrementally_,
      _An invocation is shown before its result arrives_, _A running invocation
      receives its result_.
- [x] 4.5 Implement `onCancel` — abort the stream, mark the turn cancelled, then
      hand the trimmed list back through `setMessages` so the removal survives the
      next snapshot. Verify no partial turn is left marked running — scenario _A run
      is cancelled_.
- [x] 4.6 Guard against concurrent runs so a submit during an active run does not
      interleave two streams. Verify with a test — scenario _A prompt is submitted
      while a run is active_.
- [x] 4.7 Map failures to error state rather than assistant content, keeping any
      partial text and marking it interrupted, distinguishing an unreachable
      backend from a provider failure. Verify with tests — scenarios _The chat
      provider returns an error_, _The backend is unreachable_, _A run fails after
      partial output_, _A retry succeeds after a failure_.
- [x] 4.8 Assemble the `ExternalStoreAdapter` and pass it to
      `useExternalStoreRuntime` with exactly the handler set `design.md` fixes —
      `messages`, `convertMessage`, `isRunning`, `isLoading`, `onNew`,
      `setMessages`, `onEdit`, `onReload`, `onCancel` — leaving
      `unstable_enableToolInvocations` at its `false` default and omitting
      `onAddToolResult` and `adapters.threadList`. Verify `yarn tsc:full` passes
      with no `unstable_` or deprecated member referenced.

## 5. Thread surface

Covers _Prompt submission_, _Run lifecycle and streamed completion_, _Provider and
transport error handling_ (presentation).

- [x] 5.1 Build the composer from `ComposerPrimitive` with multi-line input,
      submit-on-Enter and newline-on-Shift-Enter, styled with a CSS module over
      BUI tokens. Verify with a test driving `screen` queries and `findBy*` —
      scenario _A prompt is submitted_.
- [x] 5.2 Build the message list and viewport from `ThreadPrimitive` and
      `MessagePrimitive`, rendering assistant text as markdown, including while it
      is still growing. Verify with tests — scenarios _A reply renders
      incrementally_ and _A run completes successfully_.
- [x] 5.3 Render the running indicator and the cancel control from the runtime's
      running state. Verify with a test asserting both appear while a run is in
      flight and clear afterwards — scenario _A run is in progress_.
- [x] 5.4 Render run failures as an error distinct from assistant content, with a
      retry control, preserving any partial text. Verify with tests — scenarios
      _The chat provider returns an error_, _The backend is unreachable_, _A run
      fails after partial output_.
- [x] 5.5 Verify a non-streaming provider's single-fragment reply renders and
      completes normally, with a test — scenario _A non-streaming provider is
      used_.
- [x] 5.6 Confirm no file added under `src/components/PromptPage` imports
      `@backstage/core-components`, `@mui/material` or `@mui/icons-material`.
      Verify with `grep` over the new directory and with `yarn lint --fix`
      reporting clean.

## 6. MCP tool call rendering

Covers _MCP tool call rendering_.

- [ ] 6.1 Register one catch-all tool UI via `makeAssistantToolUI` rendering a
      tool-call part's name collapsed by default, expandable to its arguments and
      result, in BUI with `@remixicon/react` icons. Verify with tests over one and
      several invocations, asserting independent expansion — scenarios _A single
      tool is invoked_ and _Several tools are invoked in one turn_.
- [ ] 6.2 Render an invocation whose `result` is still absent as running, and let
      it resolve in place. Verify with tests — scenarios _An invocation is shown
      before its result arrives_ and _A running invocation receives its result_.
- [ ] 6.3 Add the copy affordance for an expanded result, with acknowledgement.
      Verify with a test asserting the clipboard write and the acknowledgement —
      scenario _A tool result is copied_.
- [ ] 6.4 Style a failed invocation distinctly and expose its error detail on
      expansion. Verify with a test — scenario _A tool invocation fails_.
- [ ] 6.5 Verify a reply with no tool results renders no tool-call section, with a
      test — scenario _No tool is invoked_.

## 7. Revising and regenerating

Covers _Revising and regenerating turns_.

- [ ] 7.1 Implement `onEdit` — truncate the list to the edited user turn and
      re-stream from its new text — and surface it through the message action bar
      and edit composer primitives. Verify with a test — scenario _A user turn is
      edited and re-run_.
- [ ] 7.2 Implement `onReload` for the latest user turn and surface a regenerate
      action. Verify with a test asserting a second answer is produced for the
      same prompt — scenario _An answer is regenerated_.
- [ ] 7.3 Render `BranchPickerPrimitive` so a turn with several answers shows its
      position and allows moving between them, keeping `setMessages` wired so a
      switch survives the next snapshot. Verify with a test — scenario _Moving
      between alternative answers_.

## 8. Reduced side panel

Covers _MCP server selection and provider status_ and _Selecting an existing
conversation_.

- [ ] 8.1 Build the MCP server toggle list on `useMcpServers`, feeding the enabled
      ids into the adapter's run parameters, without reusing the Material UI
      `ActiveMcpServers` view. Verify with a test asserting a disabled server's id
      is absent from the next request — scenario _A server is disabled_.
- [ ] 8.2 Build the read-only provider status block on `useProviderStatus`,
      showing connection state, reported model name and whether the provider
      streams incrementally, with no control to change them, and reporting
      unavailability without blocking the composer. Verify with tests — scenarios
      _Provider status is shown_ and _Provider status cannot be loaded_.
- [ ] 8.3 Build the conversation list on `useConversations`, ordered most recently
      updated first, with pinned conversations grouped ahead of the rest. Selecting
      one calls `loadConversation` and pushes its turns and id into the thread
      state; "new conversation" clears both. Verify with tests — scenarios _An
      existing conversation is selected_ and _A fresh conversation is started_.
- [ ] 8.4 Wire the search field to `useConversations`' `searchQuery`. Verify with a
      test asserting case-insensitive narrowing over titles and user turns —
      scenario _The list is searched_.
- [ ] 8.5 Wire pin and delete to `toggleStar` and `deleteConversation`, including
      the rollback-and-inform path on a failed delete. Verify with tests —
      scenarios _A conversation is pinned_ and _A conversation is deleted_.
- [ ] 8.6 Handle the empty and non-owning-identity cases so the panel reports an
      empty list without an error and the composer still accepts a prompt. Verify
      with a test — scenario _The user has no stored conversations_.

## 9. Workspace verification and release artifacts

- [ ] 9.1 Re-run `yarn dedupe`, then `CI=true yarn test` and `yarn tsc:full`, in
      that order, and confirm all three pass. Order matters: dedupe rewrites
      resolved versions, so earlier test and type results do not carry over.
- [ ] 9.2 Run `yarn lint --fix` and `yarn prettier --write` over the changed
      paths, and confirm every new `.ts`/`.tsx` file carries the Apache 2.0
      header with the current year, without touching the year on existing files.
- [ ] 9.3 Run `yarn build:api-reports` and commit the updated reports for every
      package whose public API changed — the frontend plugin, `mcp-chat-common`
      and `mcp-chat-node` at minimum.
- [ ] 9.4 Add a changeset for `@alithya-oss/backstage-plugin-mcp-chat` describing
      the new page for adopters and calling out the narrowed React peer range as a
      breaking change with its migration note. Confirm the backend changesets from
      2.7 are present.
- [ ] 9.5 Confirm the diff leaves `POST /chat`'s behaviour, `sendChatMessage`, and
      `src/components/ChatContainer/**`, `src/components/RightPane/**`,
      `src/components/ChatPage/**` unchanged. Verify with `git diff --stat`.
- [ ] 9.6 Confirm deployment ordering is documented for adopters: the backend
      packages must ship before the new page is mounted.
