---
'@alithya-oss/backstage-plugin-mcp-chat': minor
---

The Assistant UI prompt page at `/mcp-chat-prompt` can now revise a prompt and
compare two answers to it.

Regenerating an answer no longer replaces it. The previous answer is kept as a
version of the same prompt, the new one is added beside it, and a picker under the
answer says which of them is on screen and moves between them. Since regenerating
re-runs the MCP tools server-side, comparing two phrasings now costs one
regeneration instead of two.

Alternative answers are confined to the latest prompt. Editing a user turn still
discards the turns that follow it, so the edit composer now states how many turns
saving would discard before it applies. Sending a new prompt continues the
conversation from the answer that was shown and abandons the others, which is what
keeps a stored conversation linear.

Nothing about persistence changes: `ConversationRecord`, the conversation table
and the `/chat` and `/chat/stream` contracts are untouched, and no migration is
needed. A conversation loaded from storage comes back linear, with one answer per
turn. One consequence is worth knowing: switching version does not write anything
by itself, so the version that survives a page reload is the one the last run
stored.
