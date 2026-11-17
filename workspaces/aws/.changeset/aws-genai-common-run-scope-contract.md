---
'@alithya-oss/backstage-plugins-aws-genai-common': minor
---

Added the shared contract for per-run scoping and tool outcomes. Every addition is
optional, so an existing caller keeps compiling and an existing client keeps
behaving as before.

`ChatRequest` gains three optional fields:

- `enabledActions` — names of the agent's configured actions the run may use.
  Omitted means every action the agent's allowlist grants, an empty array means
  none.
- `enabledSearchIndexes` — types of the search indexes the run's tools may read.
  Omitted means no restriction, an empty array withholds every search tool.
- `toolResults` — declares the caller understands the new outcome event.

`EventSchema` gains a `ToolResultEvent` (`id`, `output`, `isError`) and an optional
`id` on `ToolEvent`, so a client can fill an invocation it already showed instead
of showing it twice. Because `EventSchema` is a strict discriminated union that
throws on an unknown `type`, the backend emits neither unless the request set
`toolResults` — a client that does not set it receives exactly the four event
shapes it received before.

New payload types back the tool and search index catalogues and the conversation
history: `AgentToolDescriptor`, `SearchIndexDescriptor`, `ConversationSummary`,
`ConversationTurn`, `ToolInvocation` and `ConversationRole`.
