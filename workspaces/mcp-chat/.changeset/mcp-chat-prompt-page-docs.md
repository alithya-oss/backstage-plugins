---
'@alithya-oss/backstage-plugin-mcp-chat': minor
---

Documented the Assistant UI prompt page in the plugin README, now that it is
complete: what the two pages are, how to mount or unmount either of them, and the
order the packages have to be deployed in.

The prompt page is mounted at `/mcp-chat-prompt` by the `/alpha` entry point, as
`page:mcp-chat/prompt`, beside the existing `/mcp-chat` page. The two are
siblings sharing the same stored conversations — neither shadows the other — and
`app.extensions` can disable either one. The prompt page is new frontend system
only; the classic entry point still exports `McpChatPage` alone.

**Deployment order:** deploy
`@alithya-oss/backstage-plugin-mcp-chat-backend` **before** mounting the prompt
page. The page streams over `POST /api/mcp-chat/chat/stream`, which older
backends do not serve, so against one it reports the chat service as unavailable
on every prompt. `/mcp-chat` works against any supported backend version, so
rolling the frontend back alone is safe; rolling the backend back below the
streaming route means unmounting the prompt page as well.
