Requirement references are to `specs/aws-genai/assistant-page/spec.md`,
`specs/aws-genai/run-scope/spec.md` and
`specs/aws-genai/conversation-history/spec.md`. All commands run from
`workspaces/aws` unless stated otherwise, and every test run is prefixed with
`CI=true`.

Group 1 lands the shared contract both sides compile against. Group 2 puts an
empty page on a route so every later slice is visible in the dev app. Groups 3–5
are backend work and gate the frontend groups 6–8: build the contract before the
page that consumes it.

## 1. Shared types and contract

Covers _Compatibility of the existing chat contract_ (types side).

- [ ] 1.1 Add the run-scope request fields to `ChatRequest` in
      `plugins/aws-genai-common/src/types.ts` — enabled tool names, enabled search
      index types, and the tool-outcome opt-in — all **optional**, so an existing
      caller still typechecks. Verify with `yarn tsc:full`.
- [ ] 1.2 Add an optional invocation id to `ToolEvent` and a `ToolResultEvent`
      (`id`, `output`, `isError`) to `EventSchema` in
      `plugins/aws-genai-common/src/events.ts`. Verify with tests that a payload
      without the id still parses and that the historical four event shapes are
      unchanged — scenario _A run does not opt in_.
- [ ] 1.3 Add the catalogue and history payload types — an agent tool descriptor,
      a search index descriptor, a conversation summary and a stored turn
      (including its interrupted marker and recorded invocations). Verify with
      `yarn tsc:full`.
- [ ] 1.4 Add a changeset for `aws-genai-common` describing the additive request
      fields and the new event.

## 2. Route, dependency and page wiring

Covers _Page availability alongside the historical chat page_.

- [ ] 2.1 Add `@assistant-ui/react` to `plugins/aws-genai/package.json`
      dependencies and narrow the `react` / `react-dom` peer ranges from
      `^16.13.1 || ^17.0.0 || ^18.0.0` to `^18`. Verify `yarn install` reports no
      unmet peer warning for `@assistant-ui/react`.
- [ ] 2.2 Run `yarn fix --publish` and `yarn dedupe`, and commit both results.
      Verify `yarn fix --check` and `yarn dedupe --check` exit zero — this is what
      CI gates on, and it must pass before any `tsc` result is trusted.
- [ ] 2.3 Add `assistantRouteRef` (param `agentName`) to
      `plugins/aws-genai/src/routes.ts` and a second `PageBlueprint` under
      `src/extensions/` at `/aws-genai-assistant/:agentName`, registered in the
      plugin's `extensions` and `routes`. Leave `agentChatPage` and
      `src/legacy-plugin.ts` untouched. Verify by extending `src/plugin.test.tsx`
      so it asserts both pages render at their own paths — scenarios _Both pages
      are reachable_, _The new page is not mounted_ and _The page is opened for an
      agent_.
- [ ] 2.4 Add the second sidebar entry to
      `packages/app/src/modules/nav/Sidebar.tsx`: suppress the inferred nav item
      for the new page as the existing one is suppressed, then hand-write a
      `SidebarItem` to `aws-genai-assistant/general` with its own
      `@remixicon/react` icon. Verify with `yarn start` reaching both pages from
      the sidebar, and record the check in the PR — scenario _The development
      application shows both entries_.
- [ ] 2.5 Render a placeholder page body that mounts the runtime provider with an
      empty conversation, so the route is exercised before the surface exists.
      Verify `CI=true yarn test plugins/aws-genai` passes.

## 3. Agent tool catalogue and per-run tool selection

Covers _Advertising an agent's tools_, _Per-run tool selection_.

- [ ] 3.1 Add an agent tool catalogue route to
      `plugins/aws-genai-backend/src/service/router.ts` resolving credentials the
      way `POST /v1/chat` does, delegating to the agent service. Verify with tests
      — scenarios _An agent's tools are listed_, _A configured action is not
      registered_, _The agent is unknown_.
- [ ] 3.2 Extract the allowlist intersection now inlined in
      `Agent.getAgentActions` so the catalogue route and a run share one
      implementation, keeping the existing warning for an unregistered action.
      Verify existing `Agent.test.ts` passes unchanged.
- [ ] 3.3 Thread the run's enabled tool names from the chat request through
      `DefaultAgentService.stream` to `Agent.stream`, and intersect them with the
      allowlist when building the run's actions. Verify with tests — scenarios _A
      subset of tools is enabled_, _An ungranted tool is requested_, _The field is
      absent_, _No tool is enabled_.
- [ ] 3.4 Confirm no `AgentType` signature changed, so
      `plugins/aws-genai-agent-langgraph` compiles untouched. Verify with
      `yarn tsc:full` and a `git diff` showing no change under
      `plugins/aws-genai-agent-langgraph/src`.

## 4. Search index catalogue and per-run scoping

Covers _Advertising search indexes_, _Per-run search index scoping_.

- [ ] 4.1 Add the `genai.search.indexes` block to
      `plugins/aws-genai-backend/config.d.ts` and a reader in `src/config/config.ts`
      returning, when the block is absent, the indexes the built-in search actions
      cover. Verify with tests over a configured block and an absent one —
      scenarios _The configured indexes are listed_ and _No index is configured_.
- [ ] 4.2 Add the search index catalogue route, reporting for each index whether
      any tool the agent's allowlist grants covers it. Verify with tests —
      scenario _An index no tool of the agent covers_.
- [ ] 4.3 Make the index type an input of `actions/catalogSearch.ts` and
      `actions/techDocsSearch.ts`, defaulted to the value each hardcodes today, so
      an unscoped invocation is unchanged. Verify with tests asserting the query
      string built with and without the input.
- [ ] 4.4 Apply the run's index scope where the run's actions are chosen: withhold
      an action all of whose declared indexes are disabled, and narrow the index
      argument of an action that takes one — enum over the enabled subset,
      defaulted to it. Verify with tests — scenarios _A tool bound to a disabled
      index is withheld_, _A multi-index tool is narrowed_, _A disabled index is
      requested by the agent_, _The field is absent_, _No index is enabled_.

## 5. Conversation persistence and history endpoints

Covers every requirement of `conversation-history`.

- [ ] 5.1 Add an additive Knex migration under
      `plugins/aws-genai-backend/migrations`: a nullable title on `chat_sessions`
      and a turn table keyed by session id with an ordering column, the role, the
      text, the recorded invocations and the interrupted marker. Verify the
      migration runs and rolls back on SQLite and Postgres.
- [ ] 5.2 Extend `DatabaseSessionStore` with turn append, turn read ordered by the
      ordering column, a recent-conversation query scoped to the principal and the
      agent and bounded in size, and title-once semantics. Verify with store tests
      — scenarios _Conversations are listed newest first_, _Another user's
      conversations are excluded_, _The list is bounded_, _A title is derived_,
      _The title is stable_, _A long or multi-line prompt_.
- [ ] 5.3 Persist a run's turns as the stream terminates: prompt plus reply with
      the invocations observed, nothing for a run cancelled before any text, and
      an interrupted marker for a run that failed after partial output. Verify with
      tests — scenarios _A completed run is stored_, _A cancelled run stores
      nothing_, _An interrupted run is stored as interrupted_.
- [ ] 5.4 Keep a persistence failure from failing the run, and store nothing for a
      caller that is not an authenticated end user. Verify with tests — scenarios
      _Storing fails_ and _The caller is not an end user_.
- [ ] 5.5 Add the conversation list and conversation read routes, both scoped to
      the calling user. Verify with tests — scenarios _A conversation is read
      back_, _An interrupted reply is marked_, _Another user's conversation_, _An
      unknown conversation_, _The user has no conversation_.
- [ ] 5.6 Refuse a run naming a conversation the user does not own, and keep an
      ended conversation readable but not continuable. Verify with tests —
      scenarios _A conversation is continued_, _A conversation is ended_, _A
      conversation of another user is named_.
- [ ] 5.7 Add a changeset for `aws-genai-backend` covering groups 3–5: the new
      routes, the new config block, the migration and the action inputs.

## 6. Streaming client and Assistant UI runtime adapter

Covers _Prompt submission_, _Run lifecycle and streamed completion_, _Run failure
handling_ (state layer).

- [ ] 6.1 Extend `plugins/aws-genai/src/api/AgentApiClient.ts` with the run-scope
      fields and the tool-outcome opt-in on its chat call, and with the catalogue
      and history reads. Leave `chatSync`, `getUserSession` and `endSession`
      signatures untouched. Verify with tests over a well-formed stream, a stream
      ending in `ErrorEvent`, and an aborted stream.
- [ ] 6.2 Add a `useAssistantThread` hook holding the turn list, the active
      session id, the in-flight `AbortController` and the running flag. Verify with
      tests asserting a submitted prompt is appended and a blank prompt is not —
      scenarios _A prompt is submitted_ and _An empty prompt is rejected_.
- [ ] 6.3 Map a turn to `ThreadMessageLike`: accumulated text as a `text` part,
      each invocation as a `tool-call` part keyed by its id, `status` `running`
      while fragments arrive, `complete` at end of stream, `incomplete` with reason
      `error` or `cancelled` otherwise. Verify with unit tests over each state —
      scenario _A run completes_.
- [ ] 6.4 Implement `onNew`: open the stream with the prompt, the active session
      id, the enabled tools, the enabled indexes and the outcome opt-in, then apply
      each event — appending fragments, inserting an invocation on `ToolEvent`,
      filling it in place on `ToolResultEvent`, and taking the session id from
      `ResponseEvent`. Verify with tests — scenarios _A reply renders
      incrementally_, _An invocation is shown before its outcome is known_, _A
      running invocation receives its outcome_.
- [ ] 6.5 Implement `onCancel` — abort, drop the partial turn, hand the trimmed
      list back through `setMessages` so the removal survives the runtime's resync.
      Verify with a test — scenario _A run is cancelled_.
- [ ] 6.6 Guard against concurrent runs. Verify with a test — scenario _A prompt is
      submitted while a run is active_.
- [ ] 6.7 Map failures to page state rather than assistant content, keeping partial
      text and marking it interrupted, and distinguishing an agent failure from an
      unreachable backend. Verify with tests — scenarios _The agent reports a
      failure_, _The backend is unreachable_, _A run fails after partial output_.
- [ ] 6.8 Assemble the `ExternalStoreAdapter` with exactly the handler set
      `design.md` fixes — `messages`, `convertMessage`, `isRunning`, `isLoading`,
      `onNew`, `setMessages`, `onCancel` — omitting `onEdit`, `onReload`,
      `onAddToolResult` and `adapters.threadList`, and leaving
      `unstable_enableToolInvocations` at its `false` default. Verify `yarn tsc:full`
      passes with no `unstable_` or deprecated member referenced, and with a test
      that no edit or regenerate control is rendered — scenario _A user turn offers
      no edit control_.

## 7. Conversation surface

Covers _Prompt submission_, _Run lifecycle and streamed completion_, _Tool
invocation rendering_, _Run failure handling_ (presentation).

- [ ] 7.1 Build the composer from `ComposerPrimitive`: multi-line input,
      submit on Enter, newline on Shift-Enter, cancel while running, styled with a
      CSS module over BUI tokens. Verify with a test using `screen` and `findBy*`.
- [ ] 7.2 Build the thread from `ThreadPrimitive` with an auto-scrolling viewport,
      a user turn, an assistant turn and a running indication. Verify with tests —
      scenarios _A run is in progress_, _A reply renders incrementally_.
- [ ] 7.3 Render assistant markdown through a `TextMessagePartComponent`, styled
      with a CSS module. Verify with a test asserting formatted output for a
      completed turn.
- [ ] 7.4 Render invocations with one catch-all component in the `tools.Fallback`
      slot of `MessagePrimitive.Parts`: name always, arguments and outcome
      collapsed and independently expandable, outcome copyable, failure visually
      distinct. Verify with tests — scenarios _Several tools are invoked in one
      turn_, _An invocation outcome is copied_, _A tool invocation fails_, _No tool
      is invoked_.
- [ ] 7.5 Render the run failure as page state above the composer, with the
      interrupted turn kept. Verify with a test asserting it is not rendered as
      assistant content.

## 8. Side panel

Covers _Agent tool selection_, _Search index selection_, _Recent conversation
history_.

- [ ] 8.1 Add hooks reading the tool catalogue, the index catalogue and the
      conversation list for the current agent, each exposing its loading state, its
      error and a retry. Verify with tests — scenarios _The tool list cannot be
      loaded_, _The index list cannot be loaded_, _The list cannot be loaded_.
- [ ] 8.2 Build the tool toggles, defaulting every advertised tool to enabled, and
      feed the enabled names into the next run. Verify with tests — scenarios _A
      tool is disabled_ and _Every tool is disabled_.
- [ ] 8.3 Build the index toggles, defaulting every advertised index to enabled,
      feed the enabled types into the next run, and state that the agent cannot
      search when none is enabled. Verify with tests — scenarios _An index is
      disabled_ and _Every index is disabled_.
- [ ] 8.4 Build the conversation list — newest first, titles, selection, and a new
      conversation control — replacing the page's turns and session id on
      selection, with a loading indication while a conversation is fetched. Verify
      with tests — scenarios _A recent conversation is selected_, _The list is
      ordered by recency_, _A fresh conversation is started_, _The user has no
      stored conversation_.
- [ ] 8.5 Lay the panel beside the thread with a CSS module over BUI tokens,
      collapsing under the page's narrow breakpoint. Verify by rendering the page
      at both widths in a test.

## 9. Workspace verification and release artifacts

- [ ] 9.1 `yarn fix --check` and `yarn dedupe --check` exit zero.
- [ ] 9.2 `yarn tsc:full` passes; `CI=true yarn test` passes for the whole
      workspace.
- [ ] 9.3 `yarn lint --fix` clean, `yarn prettier:check` clean.
- [ ] 9.4 Regenerate API reports the way CI does: `rm -rf dist-types`, `yarn tsc`,
      `yarn build:api-reports:only`, then confirm with
      `yarn build:api-reports:only --ci`. Regenerate knip reports where the
      workspace has the script.
- [ ] 9.5 Confirm a changeset exists for `aws-genai`, `aws-genai-common` and
      `aws-genai-backend`, each written for adopters.
- [ ] 9.6 Document the page in the `aws-genai` README and the plugin docs: the
      route, the two sidebar entries, the `genai.search.indexes` block, the
      deployment order from `design.md`'s _Migration Plan_, and the absence of edit
      and regenerate.
- [ ] 9.7 Verify the historical page end to end — the same conversation, the same
      events, no visual change — and record the check in the PR: scenarios _An
      older client chats_ and _The other endpoints are unaffected_.
