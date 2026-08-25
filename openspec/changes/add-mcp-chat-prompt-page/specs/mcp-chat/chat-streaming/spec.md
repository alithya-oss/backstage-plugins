## Purpose

Defines the streaming chat contract the `mcp-chat` backend exposes so a client can
render an assistant reply as it is produced, observe MCP tool invocations as they
happen, and cancel work in flight — without changing the existing single-response
chat endpoint.

## ADDED Requirements

### Requirement: Streaming chat endpoint

The backend SHALL expose a streaming chat endpoint accepting the same request
payload as the existing single-response chat endpoint — the prior conversation,
the set of enabled MCP server ids, and an optional conversation id — and SHALL
respond with a server-sent event stream.

The existing single-response endpoint SHALL remain available and unchanged, so a
client that does not stream keeps working.

#### Scenario: A streaming request is accepted

- **WHEN** a client posts a valid conversation to the streaming endpoint
- **THEN** the response is an event stream that stays open until the run reaches a
  terminal event

#### Scenario: The request is invalid

- **WHEN** a client posts a payload the single-response endpoint would reject
  (malformed messages, a non-array set of enabled servers, or a malformed
  conversation id)
- **THEN** the streaming endpoint rejects it the same way, before opening a stream

#### Scenario: The non-streaming endpoint is unaffected

- **WHEN** a client posts to the existing single-response chat endpoint
- **THEN** it behaves exactly as before this change, returning one complete reply

### Requirement: Stream event sequence

The stream SHALL carry named events, each with a JSON payload:

- a text event carrying an incremental fragment of the assistant reply;
- a tool-call event carrying the invocation's id, tool name, arguments and the
  MCP server that will run it;
- a tool-result event carrying the matching invocation id, its result, and
  whether it failed;
- exactly one terminal event, either completion — carrying the persisted
  conversation id when the conversation was stored, and the names of the tools
  used — or failure, carrying a human-readable message.

Text fragments SHALL arrive in reply order, so concatenating them in arrival
order reproduces the complete reply. A tool-result event SHALL NOT precede the
tool-call event bearing the same id. Exactly one terminal event SHALL be sent, and
no event SHALL follow it.

#### Scenario: A reply is streamed without tools

- **WHEN** the provider produces a reply and no tool is invoked
- **THEN** the stream carries the reply as one or more text events in order,
  followed by a completion event, and concatenating the fragments yields the
  whole reply

#### Scenario: A tool is invoked mid-run

- **WHEN** the provider requests an MCP tool during the run
- **THEN** a tool-call event is emitted with the invocation's id, name, arguments
  and server, its outcome follows as a tool-result event bearing the same id, and
  any further reply text follows as text events

#### Scenario: A tool invocation fails

- **WHEN** an invoked MCP tool returns an error or exceeds its timeout
- **THEN** a tool-result event marks that invocation as failed and the run
  continues to a terminal event rather than aborting the stream

#### Scenario: The provider fails mid-stream

- **WHEN** the provider fails after some text has already been sent
- **THEN** a failure event terminates the stream, and the fragments already sent
  are not retracted

### Requirement: Providers without native streaming

Streaming SHALL be available for every configured provider. A provider that
cannot produce incremental output SHALL be served by emitting its complete reply
as a single text event followed by the terminal event, so the client observes one
event shape regardless of provider.

The backend SHALL report, as part of provider status, whether a provider streams
incrementally, so a client can tell genuine streaming from the single-fragment
fallback.

#### Scenario: A provider streams natively

- **WHEN** the active provider supports incremental output
- **THEN** the reply arrives as several text events as the provider produces it

#### Scenario: A provider does not stream natively

- **WHEN** the active provider cannot produce incremental output
- **THEN** the endpoint still answers with a valid stream whose reply arrives as a
  single text event, followed by the terminal event

#### Scenario: Streaming capability is reported

- **WHEN** a client reads provider status
- **THEN** it can determine whether the active provider streams incrementally

### Requirement: Cancellation and disconnection

When a client disconnects or cancels, the backend SHALL stop the run: it SHALL
abandon the provider request and SHALL NOT start further MCP tool invocations for
that run. A cancelled run SHALL NOT be persisted as a completed conversation.

#### Scenario: The client disconnects mid-stream

- **WHEN** a client closes the connection while the provider is still producing
- **THEN** the backend abandons the provider request, starts no further tool
  invocation for that run, and releases the stream

#### Scenario: A cancelled run is not stored

- **WHEN** a run is cancelled before its terminal event
- **THEN** no conversation is created or updated for that run

### Requirement: Authorization and persistence parity

The streaming endpoint SHALL apply the same identity and authorization rules as
the single-response endpoint, and SHALL persist a completed conversation on the
same terms — stored for an authenticated non-guest user, skipped for a guest,
with a title generated for a newly created conversation.

A failure to persist SHALL NOT fail the run: the stream SHALL still reach its
completion event.

#### Scenario: An authenticated user streams a reply

- **WHEN** an authenticated non-guest user completes a streamed run
- **THEN** the conversation is stored and the completion event carries its id

#### Scenario: A guest user streams a reply

- **WHEN** a guest user completes a streamed run
- **THEN** the reply streams normally, nothing is stored, and the completion event
  carries no conversation id

#### Scenario: Persistence fails

- **WHEN** storing the conversation fails after the reply has been produced
- **THEN** the stream still reaches its completion event and the reply is not lost
