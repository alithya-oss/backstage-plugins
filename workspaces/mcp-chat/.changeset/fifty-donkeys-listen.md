---
'@alithya-oss/backstage-plugin-mcp-chat-common': minor
'@alithya-oss/backstage-plugin-mcp-chat-node': minor
'@alithya-oss/backstage-plugin-mcp-chat-backend': patch
---

Added the streaming seam that the upcoming streaming chat endpoint builds on.

`mcp-chat-common` now exports the stream event payload types (`ChatStreamEvent`
and its members) so backend and frontend share one wire contract.

`LLMProvider` gains a concrete `streamMessage` and a `supportsStreaming()`
returning `false`. Neither is abstract, so every existing provider module keeps
compiling and streaming works everywhere from day one: the default
implementation awaits `sendMessage` and emits the whole reply as a single
fragment. A provider adds genuine incremental output by overriding both.

Provider status now carries `supportsStreaming`, letting a client tell real
streaming from that single-fragment fallback.
