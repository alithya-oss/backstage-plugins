## Purpose

Defines the conversation page the `mcp-chat` plugin offers alongside its
existing chat page: how a user submits a prompt, how the run reports progress
and completes, how MCP tool calls and provider failures surface, and what the
page's side panel controls.

Revising a turn and regenerating an answer are **not** part of this capability.
They were, and moved to `add-mcp-chat-conversation-branching`, whose
`mcp-chat/conversation-branching` capability defines them as non-destructive
operations on a tree of turns. Nothing here describes them, because the shape
they take depends on that change's stored schema.

## ADDED Requirements

### Requirement: Page availability alongside the existing chat page

The plugin SHALL expose the conversation page on its own route, distinct from
the route of the pre-existing chat page. Both pages SHALL remain independently
reachable and functional in the same application, and the new page SHALL be
mountable without altering the existing page's route, behaviour or appearance.

#### Scenario: Both pages are reachable

- **WHEN** an application mounts both the pre-existing chat page and the new
  conversation page
- **THEN** each is reachable at its own path, and using one leaves the other's
  behaviour unchanged

#### Scenario: The new page is not mounted

- **WHEN** an application upgrades the plugin but mounts only the pre-existing
  chat page
- **THEN** the application behaves exactly as before the upgrade

### Requirement: Prompt submission

The page SHALL provide a composer that accepts multi-line text. Submitting a
non-empty prompt SHALL append it to the conversation as a user turn, clear the
composer, and start a run against the chat provider carrying the full prior
conversation and the set of currently enabled MCP servers. A blank or
whitespace-only prompt SHALL NOT start a run.

#### Scenario: A prompt is submitted

- **WHEN** the user types `list my components` and submits
- **THEN** `list my components` appears as the latest user turn, the composer is
  emptied, and a run starts carrying that prompt together with the preceding
  turns

#### Scenario: An empty prompt is rejected

- **WHEN** the user submits with the composer empty or containing only
  whitespace
- **THEN** no turn is appended and no run starts

#### Scenario: A prompt is submitted while a run is active

- **WHEN** a run is already in flight and the user submits another prompt
- **THEN** the page SHALL NOT interleave two runs against the same conversation

### Requirement: Run lifecycle and streamed completion

While a run is in flight the page SHALL indicate that the assistant is working,
and SHALL keep that indication visible until the run completes, fails or is
cancelled.

The assistant reply SHALL be rendered incrementally as it arrives, so text
becomes readable before the run finishes. The turn SHALL be marked as still
running while fragments are arriving and as complete once the run terminates.
Fragments SHALL be appended in arrival order so the rendered text always matches
what the provider has produced so far.

Where the active provider cannot produce incremental output, the reply SHALL
still render correctly — arriving as a single fragment — without a separate code
path on the page.

#### Scenario: A run is in progress

- **WHEN** a prompt has been submitted and no reply fragment has arrived yet
- **THEN** the page shows a running indication and offers a way to cancel

#### Scenario: A reply renders incrementally

- **WHEN** reply fragments arrive one after another
- **THEN** the assistant turn grows as each fragment arrives, remains marked as
  running, and its text at any moment equals the fragments received so far

#### Scenario: A run completes successfully

- **WHEN** the run reaches its terminal completion
- **THEN** the running indication clears, the assistant turn is marked complete,
  and its markdown is rendered as formatted text

#### Scenario: A non-streaming provider is used

- **WHEN** the active provider delivers its whole reply as a single fragment
- **THEN** the assistant turn renders that reply and completes normally

#### Scenario: A run is cancelled

- **WHEN** the user cancels a run that is in flight
- **THEN** the request is abandoned, the running indication clears, any partial
  assistant turn is removed rather than left marked as running, and the
  conversation is left in a state where the user can submit again

#### Scenario: A run fails after partial output

- **WHEN** the run fails once some reply text has already been rendered
- **THEN** the partial text is kept and marked as interrupted rather than silently
  presented as a complete answer, and a retry is offered

### Requirement: MCP tool call rendering

When a run reports that MCP tools were invoked, the page SHALL render each
invocation as part of the assistant turn, showing the tool's name and, on
demand, the arguments it received and the result it returned. Results SHALL be
collapsed by default, individually expandable, and copyable. A tool invocation
that failed SHALL be visually distinguishable from one that succeeded.

An invocation SHALL appear as soon as the run reports it starting, before its
result is known, and SHALL show that it is still running until its outcome
arrives.

#### Scenario: An invocation is shown before its result arrives

- **WHEN** the run reports a tool invocation starting and its result has not yet
  arrived
- **THEN** the invocation appears on the assistant turn with its name and
  arguments, marked as still running

#### Scenario: A running invocation receives its result

- **WHEN** the outcome of an invocation already shown as running arrives
- **THEN** that same invocation stops being marked as running and exposes its
  result, without appearing a second time

#### Scenario: A single tool is invoked

- **WHEN** a run reports one tool invocation with its arguments and result
- **THEN** the assistant turn shows that tool's name in a collapsed state, and
  expanding it reveals the arguments and the result

#### Scenario: Several tools are invoked in one turn

- **WHEN** a run reports more than one tool invocation
- **THEN** every invocation is listed on the assistant turn and each expands
  independently of the others

#### Scenario: A tool result is copied

- **WHEN** the user copies an expanded tool result
- **THEN** the result is placed on the clipboard and the page acknowledges the
  copy

#### Scenario: A tool invocation fails

- **WHEN** a run reports a tool invocation that returned an error
- **THEN** that invocation is shown as failed and its error detail is available
  on expansion

#### Scenario: No tool is invoked

- **WHEN** a run reports no tool invocations
- **THEN** the assistant turn shows the reply with no tool-call section

### Requirement: Provider and transport error handling

A run that fails SHALL surface the failure to the user on the page, distinguish
a failure from a successful reply, leave the user's prompt recoverable rather
than silently discarded, and offer a retry. A failure SHALL NOT be presented as
assistant content, and SHALL NOT leave the page stuck in a running state.

#### Scenario: The chat provider returns an error

- **WHEN** a run fails because the provider rejects the request
- **THEN** the page shows an error distinct from assistant content, the running
  indication clears, and a retry is offered

#### Scenario: The backend is unreachable

- **WHEN** a run fails because the plugin's backend cannot be reached
- **THEN** the page shows an error saying the chat service is unavailable, and a
  retry is offered

#### Scenario: A retry succeeds after a failure

- **WHEN** the user retries a run that previously failed and the provider answers
- **THEN** the error is replaced by the assistant turn and the conversation
  continues from that turn

### Requirement: Selecting an existing conversation

The page's side panel SHALL list the signed-in user's stored conversations, most
recently updated first, identified by title where one exists. Selecting a
conversation SHALL replace the page's conversation with its stored turns and
SHALL direct subsequent runs at that conversation. The panel SHALL offer
starting a fresh, empty conversation.

Search over the list and pinning a conversation SHALL both remain available: the
user SHALL be able to narrow the list by text matched against conversation
titles and user turns, and SHALL be able to pin and unpin a conversation, with
pinned conversations grouped ahead of the rest.

A user with no stored conversations, and a user whose identity cannot own stored
conversations, SHALL both still be able to hold a conversation on the page; only
the stored list is unavailable to them.

#### Scenario: An existing conversation is selected

- **WHEN** the user selects a stored conversation from the panel
- **THEN** its stored turns replace the page's conversation in their stored
  order, and the next prompt continues that same stored conversation rather than
  starting a new one

#### Scenario: A fresh conversation is started

- **WHEN** the user starts a new conversation from the panel
- **THEN** the page's conversation is emptied and the next prompt creates a new
  stored conversation

#### Scenario: The list is searched

- **WHEN** the user enters search text
- **THEN** the list narrows to conversations whose title or user turns match the
  text, case-insensitively

#### Scenario: A conversation is pinned

- **WHEN** the user pins a conversation
- **THEN** it is grouped ahead of the unpinned ones and stays pinned across a
  reload of the page

#### Scenario: A conversation is deleted

- **WHEN** the user deletes a conversation
- **THEN** it leaves the list immediately, and if the deletion fails it returns
  to the list and the user is told

#### Scenario: The user has no stored conversations

- **WHEN** the signed-in user has no stored conversations, or cannot own stored
  conversations
- **THEN** the panel reports an empty list without an error, and the composer
  still accepts a prompt

### Requirement: MCP server selection and provider status

The side panel SHALL list the configured MCP servers and let the user enable or
disable each one. Only enabled servers' tools SHALL be offered to the provider
on subsequent runs. The panel SHALL also show, read-only, whether the chat
provider is reachable, which model it reports, and whether it produces
incremental output or reaches the streaming endpoint through the single-fragment
fallback.

Failure to load the server list or the provider status SHALL NOT prevent the
user from holding a conversation.

#### Scenario: A server is disabled

- **WHEN** the user disables an MCP server and then submits a prompt
- **THEN** that server's tools are not offered to the provider for that run,
  while the enabled servers' tools still are

#### Scenario: Provider status is shown

- **WHEN** the provider status has loaded
- **THEN** the panel shows the connection state, the reported model name and the
  reported streaming capability, and offers no control to change them

#### Scenario: Provider status cannot be loaded

- **WHEN** the provider status request fails
- **THEN** the panel reports the status as unavailable and the composer still
  accepts a prompt
