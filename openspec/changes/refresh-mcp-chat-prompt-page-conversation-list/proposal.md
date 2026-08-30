## Why

On the prompt page, holding several conversations in a row leaves the side
panel's list exactly as it was on load: a conversation the backend has just
persisted does not appear, and continuing an existing one does not move it back
to the top. Only a page reload shows what happened. Reported against
`/mcp-chat-prompt`: "when i'm create multiple chat session in the
/mcp-chat-prompt the history does not increase".

The list is fetched once. `useConversations` re-runs its fetch when
`refreshConversations` is called, and the pre-existing chat page calls it every
time a run reports a stored conversation id — that is what keeps its history
current. `PromptPageContent` never calls it: it destructures the list, the
search state and the mutations from the hook and leaves `refreshConversations`
unused. The stream's terminal `complete` event already carries the
`conversationId` the backend saved, and `usePromptThread` already reads it — it
records it as the conversation to continue and tells nobody else.

So the page holds both halves of the fact and never joins them. The list is
correct at load and stale from the first run onward.

## What Changes

- `usePromptThread` gains an optional `onConversationPersisted` callback, invoked
  with the conversation id a run's `complete` event reported — for a conversation
  the run created and for one it appended to alike, since both change what the
  list should show.
- `PromptPageContent` passes `refreshConversations` as that callback, so a
  completed run re-fetches the stored list.

### Non-goals

- **No new endpoint and no backend change.** The id the callback carries is the
  one `complete` already reports.
- **No optimistic insertion.** The list is re-fetched rather than guessed at, so
  the title the backend summarised and the `updatedAt` it stamped are the ones
  displayed. Existing optimistic behaviour for pinning and deleting is untouched.
- **No refresh on a failed or cancelled run.** Neither persists a conversation,
  so neither changes the list.
- **No change to the pre-existing chat page**, which already refreshes.

## Capabilities

### Modified Capabilities

- `mcp-chat/prompt-page`: the stored-conversation requirement is widened to state
  that the list reflects conversations persisted by runs made on the page, not
  only those that existed when it loaded. No other requirement changes.

## Impact

**Package** — `workspaces/mcp-chat/plugins/mcp-chat`
(`@alithya-oss/backstage-plugin-mcp-chat`).

- `src/components/PromptPage/usePromptThread.ts`: new optional option on
  `UsePromptThreadOptions`; the `complete` branch of the stream loop invokes it.
- `src/components/PromptPage/PromptPageContent.tsx`: wires the hook's callback to
  `useConversations().refreshConversations`.
- `report.api.md`: unchanged. The hook and its options are exported from the
  component directory's `index.ts`, not from the package entry point, so nothing
  here reaches the published surface.

**Adopters** — a bug fix, with no API to migrate: the page behaves as its
requirement already implied. No dependency is added, so `yarn.lock` is untouched.

**Backend** — none.
