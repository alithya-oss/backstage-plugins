---
'@alithya-oss/backstage-plugin-mcp-chat': minor
---

The Assistant UI prompt page at `/mcp-chat-prompt` now has its side panel: MCP
server toggles, a read-only provider status block, and the stored conversation
list with search and pinning.

Disabling a server withholds all of its tools from the provider from the next
prompt onwards, without interrupting a run already in flight. The provider block
reports the connection state, the reported model and whether the provider
produces incremental output or reaches the streaming endpoint through the
single-fragment fallback — a distinction that explains a reply arriving in one
piece. It offers no control to change the provider or the model, matching the
existing chat page, which has no model selector either. Failing to read the
server list or the provider status is reported in place and never blocks the
composer.

Selecting a stored conversation replaces the page's turns with its own and
directs subsequent prompts at that same stored conversation; "New" empties both.
The list is searchable case-insensitively over titles and user turns, groups
pinned conversations ahead of the rest and orders each group most recently
updated first. Pin and delete are optimistic and roll back on failure, and the
panel now says so when one is rejected. A user with no stored conversations, or
an identity that cannot own them, sees an empty list without an error and can
still hold a conversation.

The panel is built with `@backstage/ui` controls and CSS modules over its design
tokens — hence the new `@backstage/ui` dependency. It deliberately does not use
Assistant UI's thread list adapter, whose thread status is exactly
`regular | archived` and which has no notion of search, so adopting it would cost
both pinning and search. The existing `/mcp-chat` page and its right pane are
unchanged.
