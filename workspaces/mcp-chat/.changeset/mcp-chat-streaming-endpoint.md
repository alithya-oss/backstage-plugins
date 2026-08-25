---
'@alithya-oss/backstage-plugin-mcp-chat-backend': minor
---

Added `POST /chat/stream`, a server-sent event endpoint that delivers the same
run as `POST /chat` while it happens: a `text` event per reply fragment, a
`tool-call` event before each MCP invocation and a `tool-result` event after it —
correlated by invocation id — then exactly one terminal `complete` or `error`
event. Payload shapes come from `ChatStreamEvent` in
`@alithya-oss/backstage-plugin-mcp-chat-common`.

It takes the same request body as `POST /chat`, validates it identically before
opening the stream, and applies the same identity and persistence rules: stored
for an authenticated non-guest user with a title generated for a new
conversation, skipped for a guest, and a storage failure never fails the run.
Disconnecting abandons the provider request, starts no further tool invocation,
and persists nothing.

Every configured provider is streamable: one that does not stream natively is
served by the `LLMProvider` fallback, which delivers its reply as a single
fragment, so clients need no second code path. `MCPClientService` gains
`streamQuery` alongside the unchanged `processQuery`.

`POST /chat` is unchanged — same request, same response, same behaviour.
