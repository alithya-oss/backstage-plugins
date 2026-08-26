---
'@alithya-oss/backstage-plugin-mcp-chat': minor
---

The Assistant UI prompt page at `/mcp-chat-prompt` now renders the MCP tool calls
of a reply. Each invocation appears on the assistant turn as a collapsed row
carrying the tool's name, expandable — independently of the others — to the
arguments it received and the result it returned, with a copy action on the
result and an acknowledgement of the copy. A failed invocation is styled apart
and exposes its error detail on expansion.

An invocation shows up as soon as the run reports it starting, marked as running
while its result is still missing, and resolves in that same row once the result
arrives rather than appearing a second time. A reply that invoked no tool renders
no tool-call section.

Tool names come from configuration and are unknown at build time, so a single
name-agnostic renderer is registered in the `tools.Fallback` slot of
`MessagePrimitive.Parts`. The deprecated `makeAssistantToolUI` is deliberately
not used: it binds a renderer to one exact tool name. No tool runs in the
browser — the rendering only describes what the backend did. The existing
`/mcp-chat` page and its `ToolCallDetails` component are unchanged.
