---
'@alithya-oss/backstage-plugin-mcp-chat': patch
---

The prompt page's conversation list now updates as you use the page.

A conversation a run stored appears in the side panel immediately, and
continuing an existing one moves it back to the top of the list — previously the
list was only what existed when the page loaded, so holding several
conversations in a row left it unchanged until a reload. A run that fails or is
cancelled stores nothing and leaves the list alone.
