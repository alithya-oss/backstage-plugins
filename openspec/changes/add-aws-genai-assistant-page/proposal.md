## Why

The `aws-genai` frontend plugin renders its chat from hand-written primitives:
`ChatHistoryComponent` maps a `ChatMessage[]` to bubbles, `ChatInputComponent`
owns the textarea and the cancel button, and `ChatSessionManager` keeps the whole
conversation in `localStorage` under one key per agent. The result is a single
conversation per agent, per browser: switching machines loses it, clearing the
page ends the session, and nothing on screen tells the user which tools the agent
may reach or how wide it will search.

Three affordances an adopter now expects are therefore absent rather than
imperfect:

- **the tools of a run are invisible and fixed.** An agent's tools come from the
  MCP actions registry, filtered by the `genai.agents.<name>.actions` allowlist in
  config. The user cannot see that list, let alone narrow it for one question.
- **search is unbounded.** `search-catalog` and `search-techdocs` hardcode
  `types[0]=software-catalog` and `types[0]=techdocs`. Every question that reaches
  a search tool searches everything that tool covers, so a question about one
  system pulls in unrelated documents and the answer is noisier for it.
- **history is browser-local.** `chat_sessions` already records one row per
  session per user, but no endpoint lists them and no turn is stored, so a user
  cannot reopen yesterday's conversation.

`@assistant-ui/react` (MIT) supplies the conversational mechanics — composer,
thread viewport, message parts, tool-call parts, cancellation — as unstyled
primitives over a runtime abstraction. The same library is already adopted in this
repository by `@alithya-oss/backstage-plugin-mcp-chat`, whose prompt page is a
working reference for the runtime wiring, the tool-call renderer and the side
panel. Adopting it for a second page in `aws-genai` lets the plugin inherit those
mechanics instead of growing them by hand, and gives the three missing
affordances a place to live.

## What Changes

- Add a **second, independent page** to the `aws-genai` plugin, on its own route
  and its own route ref, mounted per agent like the existing one. The existing
  `/aws-genai/:agentName` page, `src/components/**` and the old-frontend-system
  surface under `src/components-ofs/**` are left untouched. Nothing is removed and
  nothing is deprecated.
- Show **both pages in the dev app's sidebar**, so `yarn start` from
  `workspaces/aws` reaches the historical chat page and the modern page from two
  distinct entries.
- Drive the new page with `@assistant-ui/react` through
  `useExternalStoreRuntime`, over an adapter built on the existing
  `agentApiRef` SSE transport. No new streaming endpoint: `POST /v1/chat` already
  streams `text/event-stream`.
- **Expose an agent's tools and let the user toggle them.** The backend gains an
  endpoint listing the actions a named agent may use — the MCP actions registry
  intersected with the agent's configured allowlist — and `POST /v1/chat` accepts
  the subset enabled for that run.
- **Expose the search indexes and let the user toggle them.** The backend gains
  an endpoint listing the search index types the agent's search tools cover, read
  from config with defaults for the core actions, and `POST /v1/chat` accepts the
  subset enabled for that run. A disabled index is enforced by withholding or
  narrowing the tools that would search it, not by asking the model nicely.
- **Persist conversation turns and list recent conversations.** A new table
  stores the turns of a run against its existing `chat_sessions` row, plus a
  title derived from the first prompt; new endpoints list the signed-in user's
  recent conversations for an agent and read one back. Selecting one replays its
  turns and directs subsequent runs at that session, so the agent's own memory
  continues where the user left off.
- **Correlate tool results.** `ToolEvent` gains an optional invocation id and a
  new `ToolResultEvent` reports the outcome, sent only to a client that declared
  it understands the event. An older frontend, whose `EventSchema` rejects an
  unknown event type, therefore never receives one.

### Decisions settled here

**The modern page does not edit or regenerate turns.** Assistant UI offers both
for free, and the `mcp-chat` prompt page ships them, but `aws-genai` keeps
conversation memory **server-side**: a request carries one `userMessage` and a
`sessionId`, and the LangGraph checkpointer holds the thread under
`thread_id = sessionId`. Re-running an earlier turn would leave the checkpointer
holding the turns the page just discarded, so the model would answer with a
history the user cannot see. Supporting revision means giving the agent-type
abstraction a way to truncate or fork a thread — a change to a public extension
point implemented outside this repository. It is out of scope here and recorded as
deferred rather than half-built: `design.md` fixes the handler set so the
affordances are absent, not broken.

**Search index scoping is enforced on the tool set, not on the prompt.** The
run's enabled index types decide which search-capable actions the run may use and,
for an action that covers several indexes, what its index argument may contain.
Telling the model in the system prompt which indexes to prefer is advisory and was
rejected as the mechanism.

### Deferred

- **Editing a prompt, regenerating an answer, branching.** Needs thread
  truncation on the agent-type abstraction — see above.
- **Attachments, speech, dictation, feedback adapters.** No backend support.
- **An old-frontend-system entry for the modern page.** The new page is
  new-frontend-system only; `src/legacy-plugin.ts` gains nothing.
- **Retiring the historical page.** A separate decision once the new page has
  adopter feedback.

## Capabilities

### New Capabilities

- `aws-genai/assistant-page`: the Assistant UI conversation page of the
  `aws-genai` plugin — how it coexists with the historical chat page, how a
  prompt is submitted, how a run streams, reports tool invocations, fails and is
  cancelled, and what its side panel controls: agent tools, search indexes and
  recent conversations.
- `aws-genai/run-scope`: the backend contract that makes a run's reach visible
  and selectable — listing an agent's tools and its search indexes, accepting the
  subset enabled for one run, enforcing it on the tools handed to the agent, and
  reporting tool results without breaking an older client.
- `aws-genai/conversation-history`: persistence and retrieval of a user's
  conversations — listing recent ones for an agent, reading one back, storing the
  turns of a run, titling it, and continuing or ending it.

### Modified Capabilities

None. `openspec/specs/` holds only `mcp-chat` capabilities; the `aws-genai`
plugin has no spec to amend, and this change adds a page beside the existing one
rather than altering its behaviour. `POST /v1/chat` without the new request
fields, `POST /v1/generate`, `POST /v1/mcp/:agent` and the session endpoints keep
their current behaviour.

## Impact

**Frontend** — `workspaces/aws/plugins/aws-genai`
(`@alithya-oss/backstage-plugin-aws-genai`).

- New sources under `src/components/AssistantPage`, a second route ref in
  `src/routes.ts`, a second `PageBlueprint` in `src/extensions/`, new exports from
  `src/index.ts`.
- `src/api/AgentApiClient.ts`: gains the run-scope fields on its chat call, the
  tool-result opt-in, and the catalogue and history reads. `chatSync`,
  `getUserSession` and `endSession` keep their signatures, so the historical page
  is unaffected.
- `package.json`: adds `@assistant-ui/react`; narrows the `react`, `react-dom`
  peer ranges from `^16.13.1 || ^17.0.0 || ^18.0.0` to `^18`, which is what
  Assistant UI declares and what Backstage 1.50 already requires.
- `src/components/**`, `src/components-ofs/**`, `src/lib/chatManager.ts`,
  `src/hooks/useChatSession.ts`: unchanged.

**Backend** — `workspaces/aws/plugins/aws-genai-backend`.

- New routes beside the existing ones: an agent tool catalogue, a search index
  catalogue, a conversation list and a conversation read.
- `Agent.getAgentActions` gains the run's scope, so the actions handed to the
  agent type are already filtered and index-narrowed. No agent type changes, so
  `aws-genai-agent-langgraph` and any third-party agent type inherit the
  behaviour.
- `SessionsStore`: a conversation title on `chat_sessions` and a new turn table,
  with an additive Knex migration.
- `actions/catalogSearch.ts` and `actions/techDocsSearch.ts`: their index type
  becomes an input rather than a literal, defaulted to today's value so an
  unscoped invocation behaves exactly as before.
- `config.d.ts`: a `genai.search.indexes` block, optional, with defaults covering
  the core actions.

**Shared** — `workspaces/aws/plugins/aws-genai-common`: the new request fields,
the optional invocation id, `ToolResultEvent`, and the catalogue and history
payload types.

**Workspace** — `workspaces/aws/yarn.lock` gains the Assistant UI tree
(`@assistant-ui/core`, `@assistant-ui/store`, `@assistant-ui/tap`,
`assistant-stream`, `radix-ui`, `zustand`, `react-textarea-autosize`), all MIT.
Assistant UI Cloud is a paid hosted service and is not used: the runtime points at
the plugin's own backend. `workspaces/aws/packages/app` gains a second sidebar
entry.

**Adopters** — additive. The new page must be mounted explicitly, every new
request field is optional, and a client that sends none of them gets today's
behaviour. Changesets are needed for `aws-genai`, `aws-genai-common` and
`aws-genai-backend`.
