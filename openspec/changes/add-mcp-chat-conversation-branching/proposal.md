## Why

On the Assistant UI prompt page delivered by `add-mcp-chat-prompt-page`, editing
a turn and regenerating an answer are **destructive**. The merged
`usePromptThread` truncates on every one of the three paths — `onEdit` slices to
the edited turn, `onReload` and `retry` slice past the answer they replace — so
correcting a typo in an earlier prompt silently discards every exchange that
followed, and regenerating an answer the user half-liked throws the previous one
away with no way back. The observable habit that follows is users copying an
answer before daring to regenerate it: work the tool should be doing.

Making those actions non-destructive means a conversation is a **tree**, not a
list — and the tree has to survive a page reload, otherwise the branch picker
teaches the user that alternatives are kept and the next reload silently denies
it. Surviving a reload is what makes this its own change: `ConversationRecord.messages`
is `ChatMessage[]`, serialised into a single `messages` column, with no `parentId`
and no notion of a branch anywhere. `add-mcp-chat-prompt-page` explicitly ruled
persistence out of its scope, and the stored shape lives in **each adopter's**
database, not ours — so it needs a proposal of its own rather than a task grafted
onto a change that promised not to touch it.

## What Changes

- Turn the prompt page's conversation state into a **flat node list plus a head**
  — `{ id, parentId, role, text, invocations, status }[]` and a `headId` naming
  the visible leaf. No nested structure: this is the shape Assistant UI consumes.
- Feed the runtime through **`messageRepository`** —
  `ExportedMessageRepository.fromBranchableArray(items, { headId })` — instead of
  `messages`, which is what makes `BranchPickerPrimitive` able to see siblings at
  all.
- **BREAKING (internal to the plugin):** the external store adapter's member set
  changes. `messages` and `convertMessage` leave, `messageRepository` arrives, and
  `setMessages` starts receiving the runtime's own `ThreadMessage[]` rather than
  our view model. `usePromptThread.test.tsx` freezes that set with
  `expect(Object.keys(result.current.adapter).sort())`, so the assertion changes
  from nine keys to eight. No published export changes.
- Make the three transitions **additive** instead of destructive: editing an
  earlier user turn **forks** a sibling under the same parent, regenerating adds a
  sibling answer and moves the head, and nothing already produced is discarded.
- **Persist the tree.** A new nullable `message_tree` column carries
  `{ version, headId, nodes }`; the existing `messages` column keeps holding the
  **visible path** as `ChatMessage[]`, derived on every save. The tree is the
  source of truth for the prompt page; the linear column is a documented
  backward-compatibility projection that keeps `POST /chat`, the pre-existing
  chat page and any older backend reading a coherent conversation.
- **Migrate by lifting, not by rewriting data.** The schema migration is additive
  DDL only. A row with no tree — every row that exists today — is read as a
  degenerate tree where each node's `parentId` is the preceding message, and is
  upgraded in place the first time the new backend saves it. No adopter-run data
  rewrite, and dropping the column is a complete rollback.
- Carry the branch point over the wire: the streaming request gains an optional
  parent node id so a run appends under the node the user acted on, and a
  head-only endpoint records a branch switch that produced no run.
- Give branch navigation an **orientation affordance** beyond bare chevrons —
  position shown without hovering, an explicit signal that the turns below a
  switch changed, and a way back to the newest branch — so the page avoids the
  known ChatGPT failure of losing track of which branch one is on.
- Keep every MCP tool result **with its own branch**: nodes carry their
  `invocations`, so switching back to an alternative re-runs nothing.

### Scope taken over from `add-mcp-chat-prompt-page`

That change's spec carried a **Revising and regenerating turns** requirement
which nothing implements: its task group 7 was suspended pending the A/B/C
arbitration, and option B was chosen. Under B the requirement's semantics change
outright — editing forks instead of truncating — so it is **removed from that
change's delta spec and its proposal, and reappears here**, reshaped, as
_Non-destructive revision_ and _Regenerating an answer_. Its `tasks.md` group 7
is rewritten to record the move rather than leaving three unchecked boxes that
read as forgotten. This is what keeps the archive step from claiming a capability
the code does not have.

### Decisions settled here

**`unstable_onBranchChange` is not a dependency.** `ExternalStoreBranchChange`
and `unstable_onBranchChange` both carry
`@deprecated This API is still under active development and might change without notice.`
in `0.15.16` — the same marker that ruled out `adapters.threadList` for the
conversation list. They are not needed: `messageRepository` and `setMessages`
carry no such marker, and the callback's own documentation states that
"switching still requires `setMessages`, and this callback does not on its own
enable branch switching". `design.md` records what the callback would add and
why the design works without it.

### Deferred

- **Branch-aware conversation titles and search.** The side panel keeps working
  over the visible path; naming or searching individual branches is not in scope.
- **Cross-device branch sync beyond the persisted head.** The stored head is the
  last branch the owner viewed; two tabs open on one conversation still race on
  it, last write wins.
- **Branching on the pre-existing chat page.** It stays on `POST /chat` and the
  linear projection.

## Capabilities

### New Capabilities

- `mcp-chat/conversation-branching`: the prompt page's tree conversation — how
  editing forks, how regeneration adds an alternative, how a user moves between
  alternatives and stays oriented, and what a reload restores.
- `mcp-chat/conversation-tree-storage`: the stored shape of a branched
  conversation — the tree envelope and its persisted head, the linear projection
  kept for backward compatibility, how a pre-existing linear row is read, how a
  writer that does not understand the tree is handled, and the bounds on growth.

### Modified Capabilities

None. `openspec/specs/` is still empty — `add-mcp-chat-prompt-page` has not been
archived — so there is no published spec to amend. The requirement this change
takes over is removed from that change's own delta rather than expressed as a
delta on a spec that does not exist yet.

## Impact

**Frontend** — `workspaces/mcp-chat/plugins/mcp-chat`
(`@alithya-oss/backstage-plugin-mcp-chat`).

- `src/components/PromptPage/promptThreadTypes.ts`: `PromptTurn` gains
  `parentId` and becomes a node; the thread's state gains `headId`.
- `src/components/PromptPage/convertMessage.ts`: keeps mapping one node to a
  `ThreadMessageLike`, but is now called by our repository builder rather than
  handed to the runtime as `convertMessage`.
- `src/components/PromptPage/usePromptThread.ts`: the list becomes a node set
  plus a head; `onEdit`, `onReload`, `retry` and `onCancel` stop slicing;
  `setMessages` becomes the branch-switch sink.
- `src/components/PromptPage/PromptMessage.tsx` and a new branch picker
  component: the orientation affordance.
- `src/api/McpChatApi.ts`: the streaming call carries the parent node id, and a
  head-update call is added. Existing method signatures are otherwise unchanged.

**Backend** — `mcp-chat-backend`, `mcp-chat-common`.

- A second knex migration adding one nullable `message_tree` text column.
  Additive DDL only; `messages` is untouched.
- `ChatConversationStore`: writes the tree beside the projection, reads a
  missing or corrupt tree as a lift of `messages`, and clears the tree when a
  writer that does not understand it rewrites `messages`.
- `mcp-chat-common`: the stored node and envelope types, plus the optional tree
  on `ConversationRecord` and `ConversationRow`.
- `POST /chat/stream` gains an optional parent node id; a head-update route is
  added under the conversation routes. `POST /chat` keeps its behaviour, and
  writing through it discards the tree by design.

**Adopters** — the DDL runs automatically: `ChatConversationStore.create` calls
`client.migrate.latest()` before the store exists, so no request is ever served
against a database missing the column. What an adopter must know is the rollback
shape (drop the column, keep every conversation, lose the branches) and that
holding one conversation open in both pages costs the branches.
Changesets are needed for the frontend plugin, `mcp-chat-backend` and
`mcp-chat-common`. No published API is removed, so no breaking changeset —
the adapter shape is internal.
