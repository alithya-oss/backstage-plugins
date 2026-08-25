---
'@alithya-oss/backstage-plugin-mcp-chat': minor
---

Added `streamChatMessage` to `McpChatApi`. It runs the same query as
`sendChatMessage` against the backend's `POST /chat/stream`, yielding the run's
events as they arrive — `text`, `tool-call`, `tool-result`, then exactly one
terminal `complete` or `error` — and accepts an `AbortSignal` to cancel it. A
failure that prevents the stream is thrown, so a caller can tell an unreachable
backend from a provider failure the stream reports. `sendChatMessage` and every
other method are unchanged.

The Assistant UI prompt page at `/mcp-chat-prompt` now carries the conversation
state behind that stream: an `ExternalStoreAdapter` over React state, with turns
growing fragment by fragment, tool invocations shown as soon as they start and
filled in place when their result lands, one run at a time per conversation, and
failures kept as error state that preserves partial text instead of presenting it
as a finished answer. The conversation surface itself lands in a follow-up.

**Deployment order:** deploy `@alithya-oss/backstage-plugin-mcp-chat-backend`
before mounting the prompt page. Against an older backend the streaming route
answers 404, which the page reports as the chat service being unavailable.

Aligned this workspace's `typescript` devDependency with the rest of the
repository (`~5.4.0` to `~5.8.0`). `@assistant-ui/react` ships declarations that
use the generic `Uint8Array<ArrayBuffer>` introduced in TypeScript 5.7, so the
older compiler could not typecheck them. No effect on published packages.
