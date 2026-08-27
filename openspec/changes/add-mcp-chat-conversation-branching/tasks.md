Requirement references are to
`specs/mcp-chat/conversation-tree-storage/spec.md` and
`specs/mcp-chat/conversation-branching/spec.md`. All commands run from
`workspaces/mcp-chat` unless stated otherwise.

Groups 1 and 2 are backend work and gate the frontend: the tree has to be
storable and reachable before the page holds one. Group 3 is the state change
every later frontend group builds on.

## 1. Stored tree schema and reading pre-branching rows

Covers _A stored conversation carries its tree and its head_, _A conversation
stored before branching is read as a single path_, _A conversation stays readable
when its tree cannot be used_, _A linear projection is kept for callers that
predate branching_.

- [ ] 1.1 Add the stored node and envelope types to `plugins/mcp-chat-common` —
      an envelope of `{ version, headId, nodes }` whose nodes carry
      `id`, `parentId`, `role`, `content`, optional tool invocations and a
      creation timestamp — plus the optional tree on
      `ConversationRecord` and the optional `message_tree` column on
      `ConversationRow`. Leave `ChatMessage` and the existing `messages` field
      alone. Verify with `yarn tsc:full`.
- [ ] 1.2 Add a knex migration to `plugins/mcp-chat-backend/migrations` adding one
      **nullable** `message_tree` text column to `mcp_chat_conversations`, with a
      `down` that drops it. No change to any existing column. Verify by running
      the existing `ChatConversationStore` tests, which migrate a real SQLite
      database.
- [ ] 1.3 Add pure helpers for the two derivations both later groups need — the
      path from the root to a head, and the lift of a `ChatMessage[]` into a
      degenerate tree with ids derived deterministically from the conversation id
      and the index. Keep them free of database access so they are testable on
      their own. Verify with unit tests over a linear conversation, a branched
      one, and an empty one — scenarios _A conversation stored before branching is
      opened_ and _An empty conversation is read_.
- [ ] 1.4 Make `rowToRecord` return a tree in every case: the stored one when it
      parses and its `parentId`/`headId` references all resolve, the lift
      otherwise, logging the fault. Never throw and never empty the conversation.
      Verify with tests over a null column, a malformed payload, an unknown
      `version`, and a tree naming a missing parent or head — scenarios _The
      stored tree is malformed_, _The stored tree names a turn that does not
      exist_.
- [ ] 1.5 Make the tree-aware save write the tree and the projection in the same
      call, the projection being the path to the head. Verify with a test
      asserting that a save of a branched conversation leaves `messages` holding
      exactly the visible path — scenarios _A branched conversation is stored and
      read back_, _The projection follows the head_, _A caller that predates
      branching reads the conversation_.
- [ ] 1.6 Enforce the retained-turn bound on write: drop off-path alternatives
      oldest first until the conversation fits, never touching the path to the
      head. Read the bound from config with a documented default, and document it
      in `plugins/mcp-chat/README.md` beside the existing conversation limit.
      Verify with tests — scenarios _The bound is reached_, _The path to the head
      alone exceeds the bound_, _The bound is not configured_.
- [ ] 1.7 Clear `message_tree` on any write that goes through the pre-branching
      path, so a caller that ignores the tree cannot leave it describing turns the
      list no longer holds. Verify with a test that writes through the old path on
      a branched conversation and reads back a single path — scenarios _The
      conversation is continued from a caller that ignores the tree_, _The
      conversation is branched again afterwards_.
- [ ] 1.8 Confirm `POST /chat`, `sendChatMessage` and
      `src/components/ChatContainer/**` are untouched, and that the pre-existing
      page still reads a conversation the branching path wrote. Verify with
      `git diff` plus the existing tests for those paths.

## 2. Tree-aware run persistence and the head endpoint

Covers _A run is stored under the turn it was started from_, _The head is recorded
without a run_, _Storing the tree fails_.

- [ ] 2.1 Accept an optional parent node id on `POST /chat/stream`, validated with
      the rest of the body before the stream opens. Absent or naming a node that is
      not stored, fall back to the current head rather than failing the run.
      Verify with tests — scenarios _A run forks from an earlier turn_, _A run
      names no predecessor_, _A run names a predecessor that does not exist_.
- [ ] 2.2 Persist a completed run as two nodes under that parent — the user turn,
      then the answer carrying its tool invocations — and move the head to the
      answer. Keep the existing rule that a persistence failure does not fail the
      run. Verify with tests — scenarios _A stored turn keeps its tool results_,
      _Storing the tree fails_.
- [ ] 2.3 Add the head-only update route under the conversation routes, authorised
      by ownership like its neighbours, rejecting a head that is not among the
      conversation's nodes. Verify with tests including a non-owner and an unknown
      node id — scenario _The head is recorded without a run_.
- [ ] 2.4 Add a changeset for `mcp-chat-common` and one for `mcp-chat-backend`
      describing, for adopters, the new column, that no data migration is
      required, and what rolling back costs.

## 3. Frontend tree state and the `messageRepository` adapter

Covers the state layer of _Non-destructive revision_, _Regenerating an answer_,
_Moving between alternatives_, _Branches survive a reload_.

- [ ] 3.1 Give `PromptTurn` a `parentId` in `promptThreadTypes.ts` and hold
      `nodes` plus `headId` in `usePromptThread`, replacing the flat list. Derive
      the visible path with the shared walk. Verify with `yarn tsc:full`.
- [ ] 3.2 Build the adapter's `messageRepository` in a `useMemo` keyed on `nodes`
      and `headId`, mapping each node through the existing `convertMessage` before
      `ExportedMessageRepository.fromBranchableArray(items, { headId })`. Every
      message must carry its `id` — `fromBranchableArray` throws otherwise.
- [ ] 3.3 **Remove `messages` and `convertMessage` from the adapter**, and add a
      code comment stating why `convertMessage` must not come back: with it
      present, the runtime routes `setMessages` through
      `getExternalStoreMessages`, which returns nothing for repository-built
      messages, so the first branch switch empties the thread. Update the frozen
      key list in `usePromptThread.test.tsx` from nine keys to the eight that
      `design.md` fixes, and keep the assertions that `onAddToolResult` and
      `unstable_enableToolInvocations` stay absent.
- [ ] 3.4 Reimplement `setMessages` as the branch-switch sink: take the runtime's
      visible `ThreadMessage[]`, set `headId` to its last id, and change no node.
      Verify with a test that a switch moves the head and loses nothing —
      scenarios _Moving between alternatives_, _A prompt continues the selected
      alternative_.
- [ ] 3.5 Load a stored conversation as nodes plus head, and send the head-only
      update when a switch starts no run. Verify with tests — scenarios
      _Alternatives are restored_, _The last viewed path is restored_, _A
      conversation with no alternatives is restored_.
- [ ] 3.6 Confirm no `unstable_` or `@deprecated` member of `@assistant-ui/react`
      is referenced — specifically not `unstable_onBranchChange`,
      `ExternalStoreBranchChange` or `bindExternalStoreMessage`. Verify with
      `grep` over `src/components/PromptPage` and `yarn tsc:full`.

## 4. Branching transitions

Covers _Non-destructive revision_, _Regenerating an answer_, _Cancelling a run in
a branched conversation_.

- [ ] 4.1 Rewrite `onEdit` to fork: attach the edited text as a sibling under the
      edited node's parent, send the path leading to it as the run's context and
      that parent as the run's parent node id, and slice nothing. Verify with
      tests — scenarios _An earlier turn is edited_, _The edited turn's context
      excludes the abandoned branch_, _The latest turn is edited_.
- [ ] 4.2 Rewrite `onReload` to add a sibling answer under the given `parentId`
      and move the head to it, keeping the previous answer and its subtree.
      Verify with tests — scenarios _An answer is regenerated_, _A regenerated
      answer keeps the earlier answer's tool results_.
- [ ] 4.3 Rewrite `retry` to keep the failed attempt as an alternative instead of
      slicing past it. Verify with a test asserting the failed attempt is still
      reachable after a successful retry — scenario _A failed run is retried_.
- [ ] 4.4 Rewrite `onCancel` to drop only the nodes the cancelled attempt created
      and restore the head the run started from, leaving every pre-existing
      alternative in place and no turn marked running. Verify with tests —
      scenarios _A regeneration is cancelled_, _A fork is cancelled_.
- [ ] 4.5 Confirm the existing non-branching scenarios of the prompt page still
      hold after the rewrite — prompt submission, incremental rendering, tool
      rendering, error handling, cancellation. Verify with `CI=true yarn test`
      over `src/components/PromptPage`, with no test disabled or relaxed.

## 5. Branch navigation and orientation

Covers _Moving between alternatives_, _Branch orientation_.

- [ ] 5.1 Render `BranchPickerPrimitive` on a turn that has alternatives, with the
      position and total **always visible**, and nothing rendered for a turn that
      has none. Verify with tests using `screen` and `findBy*` — scenarios _A
      position with alternatives is displayed_, _A position with no alternative_.
- [ ] 5.2 Hide or disable navigation while a run is in flight, matching the
      runtime, which refuses `switchToBranch` during a run and reports
      `switchBranchDuringRun: false`. Verify with a test — scenario _A run is in
      flight_.
- [ ] 5.3 Indicate that the exchanges below a switch point changed as a result of
      the switch. Verify with a test — scenario _Switching signals what changed_.
- [ ] 5.4 Show that the shown path is not the most recently created one, with a
      one-action return to the newest. Verify with a test — scenario _The shown
      path is not the newest_.
- [ ] 5.5 Keep the new components on `@backstage/ui` with CSS modules over BUI
      tokens and `@remixicon/react` icons, importing neither
      `@backstage/core-components` nor Material UI. Verify with `grep` over the
      new files and `yarn lint --fix`.

## 6. Workspace verification and release artifacts

- [ ] 6.1 Run `yarn fix --publish` if any `package.json` changed, then
      `yarn dedupe`, then `CI=true yarn test`, then `yarn tsc:full`, in that
      order, and confirm each passes. Order matters: dedupe rewrites resolved
      versions, so results collected before it do not carry over.
- [ ] 6.2 Run `yarn lint --fix` and `yarn prettier --write` over the changed
      paths, and confirm every new `.ts`/`.tsx` file carries the Apache 2.0 header
      with the current year, without touching the year on existing files.
- [ ] 6.3 Regenerate the API reports the way CI does it — drop `dist-types`, run
      `yarn tsc`, then `yarn build:api-reports:only` — and confirm
      `yarn build:api-reports:only --ci` exits zero, for every package whose
      public API changed — `mcp-chat-common` and `mcp-chat-backend` at minimum.
- [ ] 6.4 Add a changeset for `@alithya-oss/backstage-plugin-mcp-chat` describing
      non-destructive editing and regeneration for adopters, and confirm the
      backend changesets from 2.4 are present.
- [ ] 6.5 Verify the whole loop by hand in the workspace dev app: branch, reload,
      confirm the alternatives and the restored path, then open the same
      conversation on the pre-existing page and confirm it reads the visible path.
- [ ] 6.6 Confirm the deployment and rollback order from `design.md` is documented
      for adopters in `plugins/mcp-chat/README.md`: backend before frontend, and
      what dropping the column costs.
