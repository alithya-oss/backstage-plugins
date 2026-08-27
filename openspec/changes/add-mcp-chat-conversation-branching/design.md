## Context

See `proposal.md` — Why. What shapes the approach is what is already merged and
what the library actually offers, both read from the code and the published
package rather than from documentation.

**The frontend state is a list, and three handlers slice it.** In
`plugins/mcp-chat/src/components/PromptPage/usePromptThread.ts`, `PromptTurn[]`
is held in state and mirrored in `turnsRef`. `onEdit` runs
`turnsRef.current.slice(0, index)`, `onReload` runs `slice(0, index + 1)` and
`retry` runs `current.slice(0, lastUser + 1)`. `PromptTurn`
(`promptThreadTypes.ts`) has `id`, `role`, `text`, `invocations`, `status` — and
no `parentId`. `convertMessage.ts` maps one turn to a `ThreadMessageLike`. The
hypothesis "the conversation is a list" is confined to those three files; nothing
above them consumes the list, because the surface and the panel consume the
adapter.

**The adapter's member set is asserted, not incidental.**
`usePromptThread.test.tsx` freezes it with
`expect(Object.keys(result.current.adapter).sort()).toEqual([...])` over nine
keys: `convertMessage`, `isLoading`, `isRunning`, `messages`, `onCancel`,
`onEdit`, `onNew`, `onReload`, `setMessages`.

**What `@assistant-ui/core@0.3.15` offers, verified in its typings and its
compiled runtime.** `ExternalStoreAdapterBase` carries
`messageRepository?: ExportedMessageRepository` with **no** deprecation marker,
beside `messages?: readonly T[]`. `ExportedMessageRepository.fromBranchableArray`
takes `{ message: ThreadMessageLike; parentId: string | null }[]` and
`{ headId }`, and throws unless every message carries an `id`. Internally,
`MessageRepository.getBranches(messageId)` returns the children of that message's
parent — the siblings — which is what feeds the `branchNumber` / `branchCount`
message state that `BranchPickerPrimitive` renders. `ExportedMessageRepository`
and `BranchPickerPrimitive` are both re-exported from `@assistant-ui/react`;
`MessageRepository` itself is not, so it is internal machinery, not a surface to
build on.

Three behaviours of `external-store-thread-runtime-core.js` decide the design:

1. `messages` and `messageRepository` are alternatives, and the repository wins:
   the store update reads `store.messageRepository` first and only falls back to
   `store.messages`, throwing
   `ExternalStoreAdapter must provide either 'messages' or 'messageRepository'`
   when neither is present.
2. It early-returns when `oldStore.messageRepository === store.messageRepository`
   and `isRunning` is unchanged. The repository object must therefore be a new
   object whenever the tree or the head changes.
3. `updateMessages` — the sink for a branch switch — is
   `if (this._store.convertMessage !== undefined) setMessages(messages.flatMap(getExternalStoreMessages)); else setMessages(messages);`.
   `getExternalStoreMessages` reads a symbol that only
   `bindExternalStoreMessage` sets, and that binding happens **only** on the
   `store.messages` + `convertMessage` path. Messages built by
   `fromBranchableArray` carry no binding, so `getExternalStoreMessages` returns
   the empty array for each of them.

Point 3 is the trap: supplying `messageRepository` **and** `convertMessage`
together makes the first branch switch call `setMessages([])` and wipe the
conversation. It is not a hypothetical — it is the literal code path.

**`switchToBranch` requires `setMessages` and refuses during a run.** It throws
`Runtime does not support switching branches.` when `setMessages` is absent,
returns early when `isRunning` is true, and the capability map reports
`switchBranchDuringRun: false`.

**Persistence is one JSON column, and migrations run before the store exists.**
`ConversationRecord.messages` is `ChatMessage[]`; `ConversationRow.messages` is
the JSON string of it. `ChatConversationStore.create` calls
`client.migrate.latest({ directory: migrationsDir })` and only then constructs the
store, so no route can serve against a database missing this change's column.
`rowToRecord` already treats a corrupt `messages` payload as an empty
conversation rather than throwing — the posture this design extends. The
pre-existing chat page and `POST /chat` read and write the same table.

## Goals / Non-Goals

**Goals**

- Depend only on Assistant UI surface that carries neither `unstable_` nor
  `@deprecated`.
- Keep one authoritative representation of a conversation, with any second shape
  explicitly derived from it and named as such in the code.
- Make the schema change safe for an adopter to deploy and to roll back, without
  asking them to run a data migration.
- Keep `POST /chat`, `sendChatMessage` and the pre-existing chat page working
  unchanged, including against rows the branching page has written.
- Keep the branch-point knowledge on the server side of the write, so the client
  does not upload a whole conversation on every run.

**Non-Goals**

- No normalisation of conversation turns into their own table. The bound on
  conversation size and the single-column read stay as they are.
- No branch awareness anywhere but the prompt page — not in the side panel's
  titles or search, not on the pre-existing page.
- No conflict resolution between two clients editing one conversation. Last write
  wins on the head, as today on the messages.
- No use of `unstable_onBranchChange`, and no client-side tool machinery: tools
  keep running server-side.

## Decisions

### Frontend state: a flat node list plus a head, not a nested tree

`PromptTurn` gains `parentId: string | null` and becomes `PromptNode`; the hook
holds `nodes: PromptNode[]` and `headId: string | null`. The tree is expressed
only by `parentId`, never by nesting.

This is not a stylistic choice: `fromBranchableArray` consumes exactly
`{ message, parentId }[]`, and the stored envelope is the same shape, so a flat
list means no traversal code on either boundary. The visible path is derived by
walking `parentId` up from `headId` — the one place the tree is traversed, and it
is a loop of a few lines.

Rejected: a nested `children[]` structure (needs flattening for both the adapter
and the store, and makes "the visible path" an expensive query); keeping the list
and holding alternatives in a side map keyed by turn id (this is the half-B the
arbitration rejected — two shapes and no answer to which is authoritative).

### Adapter: `messageRepository` **without** `convertMessage`

The adapter becomes:

| Member                        | Used | Notes                                                            |
| ----------------------------- | ---- | ---------------------------------------------------------------- |
| `messageRepository`           | yes  | rebuilt when `nodes` or `headId` changes; a new object each time |
| `messages` / `convertMessage` | no   | both removed — see below                                         |
| `isRunning`                   | yes  | unchanged                                                        |
| `isLoading`                   | yes  | unchanged                                                        |
| `onNew`                       | yes  | appends under `headId`                                           |
| `onEdit`                      | yes  | forks under the edited node's parent                             |
| `onReload`                    | yes  | adds a sibling answer under `parentId`                           |
| `onCancel`                    | yes  | aborts, drops the attempt's nodes, restores the previous head    |
| `setMessages`                 | yes  | the branch-switch sink; receives `readonly ThreadMessage[]`      |

Eight keys instead of nine. `usePromptThread.test.tsx`'s frozen list changes
accordingly, and that is the point of asserting it: the change is visible in the
diff instead of being absorbed.

`convertMessage` is dropped **because** `messageRepository` is adopted, for the
reason in Context point 3: with both present, `updateMessages` routes
`setMessages` through `getExternalStoreMessages`, which returns nothing for
repository-built messages, so the first `BranchPicker` click empties the thread.
Dropping it makes `T` default to `ThreadMessage`, `setMessages` receive the
runtime's own visible path, and the whole thing type-check without a cast. The
existing `convertMessage` function is kept and still called — by our repository
builder, one node at a time, before `fromBranchableArray` — so nothing about
message rendering changes.

`setMessages(visible)` then does exactly one thing: read `visible.at(-1)!.id` and
set it as `headId`. Our node ids are the ThreadMessage ids, because we set `id` on
every `ThreadMessageLike` we hand to `fromBranchableArray`, so no mapping table is
needed. Nodes are never removed on a switch — the runtime's list is a view, not a
new truth.

Rejected: keeping `convertMessage` and calling `bindExternalStoreMessage`
ourselves on each built message (it is exported, but marked
`@deprecated This API is experimental and may change without notice.` — the same
criterion that rules out `adapters.threadList`, and it would make us maintain the
binding invariant by hand); keeping `messages` and reconstructing branches in our
own UI (`BranchPickerPrimitive` reads the runtime's branch state, so a hand-rolled
picker would mean reimplementing the repository).

### `unstable_onBranchChange` is not needed, and is not used

It reports `{ headId, visibleMessageIds }` after an explicit switch, with
optimistic ids already filtered out. Everything it reports is derivable from the
`setMessages(visible)` call that the same `switchToBranch` makes one line earlier:
`headId` is `visible.at(-1)!.id` and `visibleMessageIds` is `visible.map(m => m.id)`.
Its own documentation says as much — "switching still requires `setMessages`, and
this callback does not on its own enable branch switching".

What it would add is the _canonical_ head — the repository skips optimistic
placeholders when computing `canonicalHeadId`. That matters when the store mints
optimistic messages, which happens when `isRunning` is true and the last visible
message is a user turn. Our run appends the assistant node itself at run start, so
the last visible message during a run is always an assistant node and no
optimistic message is ever created; and switching is refused during a run anyway.
So the distinction has no effect here.

It carries `@deprecated ... might change without notice`, exactly like
`adapters.threadList` which this project already refused for that reason. Using it
would create an exception to a rule the repository otherwise holds. If it
stabilises, adopting it is a two-line addition that replaces a derivation, not a
redesign — recorded here so the option is not lost.

### Storage: the tree in a new column, the linear path kept as a derived projection

One nullable `message_tree` text column is added, holding
`{ version: 1, headId, nodes: StoredNode[] }` where a `StoredNode` is
`{ id, parentId, role, content, toolInvocations?, createdAt }`. The existing
`messages` column keeps holding `ChatMessage[]` — **the path from the root to the
head** — rewritten on every save.

This looks like the two-representations problem the arbitration warned about, and
the difference is worth being precise about. What made half-B unmaintainable was
that neither shape was authoritative: the projection was lossy and the code could
not answer which branch was real. Here the tree is authoritative and the list is
derived, one direction only, with the head as the answer to "which branch is
real". Deriving it is a pure function of `(nodes, headId)` and it is recomputed on
every write, so the two cannot drift.

What the projection buys is not backward compatibility in the abstract — it is
three concrete things:

1. The **pre-existing chat page shares this table**. If the tree replaced the
   column's content, that page and `POST /chat` would break on the first branched
   conversation. This change promised not to touch them.
2. **Rollback is complete and cheap.** Dropping the column leaves every
   conversation intact on the path last viewed; only the alternatives are lost.
   No reverse data migration exists to get wrong.
3. **An older backend deployed against newer rows still works**, because knex
   hands `rowToRecord` a row with an extra field it ignores. Under an
   in-column envelope, the old reader's `JSON.parse` would succeed and hand
   `messages` an object instead of an array — a silent corruption rather than a
   degradation.

Rejected: replacing the `messages` payload with a versioned envelope in the same
column (breaks the old page and the old reader as above, and makes rollback a data
migration); a normalised `mcp_chat_conversation_nodes` table (correct in the
abstract, but it turns one read into a join plus an assembly step, and the
conversation is already bounded and read whole — the cost is real and the benefit
is a query pattern nothing asks for); storing only the tree and computing the
linear path on read (any caller that predates branching would have to be changed,
which is the promise this change is built around not breaking).

### Migration: lift on read, upgrade on write, no adopter data rewrite

The knex migration is additive DDL: one nullable column. It runs inside
`ChatConversationStore.create`, before the store is constructed, so no request is
ever served against a database without it.

A row whose `message_tree` is null — every row that exists today — is read as a
degenerate tree: `parentId` is the preceding message, the last message is the
head, and node ids are derived deterministically from the row id and the index so
two reads of an unmodified row agree. That derivation is the migration. The row is
written back in tree form the first time the branching page saves it.

This is chosen over a backfill because a backfill is the one artefact an adopter
cannot undo. The lift is deterministic, costs a walk over an array already parsed,
and leaves the decision of when a row changes to the user who opens it. It also
means there is no "before migration" window to document: an adopter deploying the
new backend on old data sees old data read correctly, immediately.

Rejected: a data-migrating knex migration writing every row's tree (irreversible,
runs at startup on a table whose size we do not control, and gains nothing the
lift does not); a `schemaVersion` column plus a rewrite job (same objection, more
moving parts).

### A writer that ignores the tree discards it

`POST /chat` and `sendChatMessage` write `messages` and know nothing of the tree.
Rather than leave a tree describing turns the list no longer contains, that write
sets `message_tree` to null. The conversation then reads as a single path — the
one that writer produced — and can gain a tree again the next time the branching
page saves it.

This is deliberately the blunt rule, and it is blunt on purpose: it makes "which
branch is real?" answerable by reading one line of code rather than by knowing the
author's intention. The cost is real and bounded — a user who branches on the new
page and then continues the same conversation on the old page loses the
alternatives, at the moment they act, not silently later. The alternative
considered was reconciling the written list against the tree by matching content;
rejected as guesswork that fails exactly when it matters.

### Wire protocol: a parent node id on the run, a head-only update otherwise

`POST /chat/stream` gains an optional parent node id naming the stored turn the
run's new turns hang under. Absent, the run appends under the current head — which
is today's behaviour, so the field is additive and an older client keeps working.
Naming a node that does not exist falls back to the head rather than failing the
run: a stale client must not be able to make a conversation unreadable.

A branch switch that starts no run needs no run, so it goes through a
head-only route under the conversation routes, authorised like the other
conversation routes by ownership. Sending it is what makes "the last viewed path
is restored" true.

Rejected: uploading the whole tree with each run (the client would become the
authority on stored data, and a large conversation would be re-uploaded per
prompt); inferring the branch point server-side from the messages sent (the
provider context is the visible path, which is identical for a fork and for an
append — the information is genuinely not there).

### Tool re-execution and conversation growth

Regenerating re-runs the provider and therefore re-runs its MCP tools; the
alternative it produces carries its own invocations. Moving back to a previous
alternative re-runs nothing, because that alternative's invocations were stored
with it. That is the user-visible gain, and it is also the growth driver: a stored
node carries tool arguments and results, which are the largest payloads in a
conversation, and no alternative is discarded.

Hence the configurable bound in the storage spec, and its rule: the path to the
head is retained in full, whatever the bound, and off-path alternatives are
dropped oldest first. The bound counts turns rather than bytes so the behaviour is
predictable to explain and to test; a default is documented in the plugin README
alongside the existing conversation limit config.

### Branch orientation: what the chevrons do not say

The known failure of a tree UI is not the absence of navigation, it is losing
track of where one is. Three affordances address it, and they are spec'd as
behaviour so the presentation can change without changing the contract:

- The position indicator is **always visible** on a turn that has alternatives,
  not revealed on hover. Hover-only disclosure is what makes a branch invisible
  until the user already suspects it exists.
- After a switch, the page **marks the exchanges below the switch point as
  changed**, so the user attributes the different content to their own action
  rather than to the model.
- When the shown path is not the most recently created one, the page **says so and
  offers one action back** to the newest. This is the recovery path for a user who
  is lost, and it is what ChatGPT lacks.

`BranchPickerPrimitive` provides the count, the position and the move; the three
points above are ours to build over it.

## Risks / Trade-offs

- **`messageRepository` is rebuilt on every state change, and a run changes state
  per fragment** → The runtime early-returns on object identity, so the object
  must be new whenever the tree changes; each new object costs an
  `addOrUpdateMessage` over every node plus a deletion sweep. That is O(nodes) per
  streamed fragment where today it is O(1). Mitigation: build it in a `useMemo`
  keyed on `nodes` and `headId` so no unrelated render rebuilds it, and coalesce
  text fragments into one state update per animation frame if profiling on a long
  conversation shows it. Measure before optimising; the node count is bounded by
  the previous decision.
- **Dropping `convertMessage` from the adapter looks like a regression to a
  reviewer** → It is the opposite, and the reason is a runtime code path rather
  than a preference. The rationale is recorded in the decision above and belongs
  in a code comment at the adapter, because the next person to add
  `convertMessage` back will break branch switching in a way no type error
  catches.
- **The linear projection is a second shape** → Mitigated by making it derived,
  one-directional, recomputed on every write, and named as a projection in the
  code. The residual risk is a future writer that updates the tree and forgets the
  projection; the store is the only writer, and the projection is computed inside
  the same method that writes the tree, so there is one place to get it right.
- **A user working the same conversation from both pages loses branches** → By
  design and immediate rather than silent-later. Documented for adopters, and the
  reason the plugin's two pages are described as alternatives rather than
  complements. Mitigation if it hurts: the old page's writes could be made to
  fail loudly on a conversation that has a tree — deliberately not done here,
  since it would change `POST /chat`'s behaviour.
- **The bound drops alternatives the user might expect to keep** → The path to the
  head is never touched, so the conversation the user is reading is never
  truncated. Off-path alternatives disappear oldest first. This is a policy that
  cannot be right for everyone; it is configurable, and its default is
  documented.
- **Two tabs on one conversation race on the head** → Last write wins, which is
  already true of the stored messages. A tab that loses the race sees another
  path on its next read. Out of scope to fix; stated so it is not discovered.
- **A stored tree written by a newer plugin version reaches an older one** →
  The envelope carries `version`, and a reader that does not recognise it falls
  back to the linear path and logs, rather than guessing. That is the same path
  as a corrupt tree, and it is spec'd.

## Migration Plan

**Deploy order.** `mcp-chat-common` and `mcp-chat-backend` first, then the
frontend. The backend's DDL runs during `ChatConversationStore.create`, before any
route is served. A frontend deployed first would call the head-update route and
get a 404; the page's existing transport-failure behaviour covers that, but the
order avoids it.

**Data.** No data migration. Rows without a tree are lifted on read and gain one
on their next write from the branching page. An adopter with a read-only database
user for the plugin will fail at startup on the DDL, as they would for any
Backstage plugin migration — worth a line in the README, not a design change.

**Rollback.** Uninstall in the reverse order and drop the `message_tree` column;
the migration's `down` does exactly that. Every conversation remains readable on
the path last viewed, because that path is what the `messages` column has been
holding all along. Alternatives are lost, which is the definition of rolling back
this change. There is no reverse transformation to run and nothing to reconcile.

**Partial rollback.** Rolling back only the frontend is safe: the tree column is
simply not read, and the old page reads the projection. Rolling back only the
backend is not — the page would call routes that no longer exist — so the order
above is the supported one.

## Open Questions

- The default value of the retained-turn bound. It changes no requirement (the
  spec fixes the rule and that a default exists), and it is best chosen from the
  size of a realistic branched conversation once the storage tasks are done.
- Whether the "return to the newest path" affordance belongs on the thread header
  or beside the branch picker. Presentation only; the spec fixes that it exists
  and costs one action.
