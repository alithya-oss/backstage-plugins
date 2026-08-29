## Purpose

Defines the conversation page the `aws-genai` plugin offers alongside its
historical chat page: how the two coexist and how a user reaches each, how a
prompt is submitted, how a run streams and completes, how tool invocations and
failures surface, and what the page's side panel controls — the agent's tools,
the search indexes a run may reach, and the user's recent conversations.

## ADDED Requirements

### Requirement: Page availability alongside the historical chat page

The plugin SHALL expose the conversation page on its own route, bound to its own
route ref and mounted per agent, distinct from the route of the historical chat
page. Both pages SHALL remain independently reachable and functional in the same
application, and the new page SHALL be mountable without altering the historical
page's route, behaviour or appearance.

The development application SHALL offer a distinct navigation entry for each of
the two pages, each with its own icon.

#### Scenario: Both pages are reachable

- **WHEN** an application mounts both the historical chat page and the new
  conversation page for the same agent
- **THEN** each is reachable at its own path, and using one leaves the other's
  behaviour unchanged

#### Scenario: The development application shows both entries

- **WHEN** the developer starts the development application
- **THEN** the sidebar shows two distinct entries with distinct icons, one leading
  to the historical chat page and one to the conversation page, and each opens the
  page it names

#### Scenario: The new page is not mounted

- **WHEN** an application upgrades the plugin but mounts only the historical chat
  page
- **THEN** the application behaves exactly as before the upgrade

#### Scenario: The page is opened for an agent

- **WHEN** the page is opened on a path naming an agent
- **THEN** the conversation, the tool list and the search index list are those of
  that agent, and opening the page for another agent shows that other agent's

### Requirement: Prompt submission

The page SHALL provide a composer accepting multi-line text. Submitting a
non-empty prompt SHALL append it to the conversation as a user turn, clear the
composer, and start a run carrying that prompt, the active conversation, the set
of currently enabled tools and the set of currently enabled search indexes. A
blank or whitespace-only prompt SHALL NOT start a run.

#### Scenario: A prompt is submitted

- **WHEN** the user types `list my components` and submits
- **THEN** `list my components` appears as the latest user turn, the composer is
  emptied, and a run starts carrying that prompt

#### Scenario: An empty prompt is rejected

- **WHEN** the user submits with the composer empty or containing only whitespace
- **THEN** no turn is appended and no run starts

#### Scenario: A prompt is submitted while a run is active

- **WHEN** a run is already in flight and the user submits another prompt
- **THEN** the page SHALL NOT interleave two runs against the same conversation

### Requirement: Run lifecycle and streamed completion

While a run is in flight the page SHALL indicate that the assistant is working
and SHALL offer a way to cancel, and SHALL keep that indication visible until the
run completes, fails or is cancelled.

The assistant reply SHALL be rendered incrementally as fragments arrive, in
arrival order, so the rendered text at any moment equals the fragments received so
far. The turn SHALL be marked as still running while fragments arrive and as
complete once the run terminates without failure. Once complete, the reply's
markdown SHALL be rendered as formatted text.

#### Scenario: A run is in progress

- **WHEN** a prompt has been submitted and no reply fragment has arrived yet
- **THEN** the page shows a running indication and offers a way to cancel

#### Scenario: A reply renders incrementally

- **WHEN** reply fragments arrive one after another
- **THEN** the assistant turn grows as each fragment arrives, remains marked as
  running, and its text equals the fragments received so far

#### Scenario: A run completes

- **WHEN** the run ends without reporting a failure
- **THEN** the running indication clears, the assistant turn is marked complete,
  and its markdown is rendered as formatted text

#### Scenario: A run is cancelled

- **WHEN** the user cancels a run in flight
- **THEN** the request is abandoned, the running indication clears, the partial
  assistant turn is removed rather than left marked as running, and the user can
  submit again

### Requirement: Tool invocation rendering

When a run reports that a tool was invoked, the page SHALL render the invocation
as part of the assistant turn, showing the tool's name and, on demand, the
arguments it received. An invocation SHALL appear as soon as the run reports it
starting and SHALL show that it is still running until its outcome arrives or the
run ends.

Where the run reports an invocation's outcome, the page SHALL show it on that same
invocation without listing the invocation twice, SHALL make it copyable, and SHALL
distinguish a failed invocation from a successful one. Arguments and outcome SHALL
be collapsed by default and expandable independently of other invocations.

#### Scenario: An invocation is shown before its outcome is known

- **WHEN** the run reports a tool invocation starting
- **THEN** the invocation appears on the assistant turn with its name and
  arguments, marked as still running

#### Scenario: A running invocation receives its outcome

- **WHEN** the outcome of an invocation already shown as running arrives
- **THEN** that same invocation stops being marked as running and exposes its
  outcome, without appearing a second time

#### Scenario: Several tools are invoked in one turn

- **WHEN** a run reports more than one tool invocation
- **THEN** every invocation is listed on the assistant turn and each expands
  independently of the others

#### Scenario: An invocation outcome is copied

- **WHEN** the user copies an expanded invocation outcome
- **THEN** the outcome is placed on the clipboard and the page acknowledges the
  copy

#### Scenario: A tool invocation fails

- **WHEN** the run reports an invocation that returned an error
- **THEN** that invocation is shown as failed and its error detail is available on
  expansion

#### Scenario: No tool is invoked

- **WHEN** a run reports no tool invocation
- **THEN** the assistant turn shows the reply with no invocation section

### Requirement: Run failure handling

A run that fails SHALL surface the failure on the page, distinguished from
assistant content, SHALL clear the running indication, and SHALL leave the
conversation in a state where the user can submit again. A failure SHALL NOT be
presented as assistant content. Where reply text had already arrived, it SHALL be
kept and marked as interrupted rather than presented as a complete answer.

The page SHALL distinguish a failure reported by the agent from an unreachable
backend.

#### Scenario: The agent reports a failure

- **WHEN** a run fails because the agent reports an error
- **THEN** the page shows an error distinct from assistant content and the running
  indication clears

#### Scenario: The backend is unreachable

- **WHEN** a run fails because the plugin's backend cannot be reached
- **THEN** the page shows an error saying the chat service is unavailable

#### Scenario: A run fails after partial output

- **WHEN** the run fails once some reply text has already been rendered
- **THEN** the partial text is kept and marked as interrupted rather than
  presented as a complete answer

### Requirement: No revision of earlier turns

The page SHALL NOT offer editing an earlier turn, regenerating an answer, or
navigating between alternative answers, because the conversation's memory is held
by the agent and the page cannot rewrite it.

#### Scenario: A user turn offers no edit control

- **WHEN** the conversation holds a user turn
- **THEN** the page offers no control to edit it and no control to regenerate the
  answer to it

### Requirement: Agent tool selection

The side panel SHALL list the tools the agent may use, as reported by the backend
for that agent, showing each tool's name and description, and SHALL let the user
enable or disable each one. Only enabled tools SHALL be offered to the agent on
subsequent runs; a toggle SHALL NOT affect a run already in flight.

Failure to load the tool list SHALL NOT prevent the user from holding a
conversation, and SHALL be reported with a way to retry.

#### Scenario: A tool is disabled

- **WHEN** the user disables a tool and then submits a prompt
- **THEN** that tool is not offered to the agent for that run, while the enabled
  tools still are

#### Scenario: Every tool is disabled

- **WHEN** the user disables every tool and then submits a prompt
- **THEN** the run carries no tool and the page still shows the reply

#### Scenario: The tool list cannot be loaded

- **WHEN** the tool list request fails
- **THEN** the panel reports the list as unavailable with a way to retry, and the
  composer still accepts a prompt

### Requirement: Search index selection

The side panel SHALL list the search indexes a run may reach, as reported by the
backend for that agent, and SHALL let the user enable or disable each one. Only
enabled indexes SHALL be reachable by the tools of subsequent runs.

Where every index is disabled, the page SHALL state that the agent cannot search
rather than implying it still can.

Failure to load the index list SHALL NOT prevent the user from holding a
conversation, and SHALL be reported with a way to retry.

#### Scenario: An index is disabled

- **WHEN** the user disables an index and then submits a prompt
- **THEN** no tool of that run returns a result from that index, while the enabled
  indexes are still searched

#### Scenario: Every index is disabled

- **WHEN** the user disables every index
- **THEN** the panel states that the agent cannot search, and a submitted prompt
  still produces a reply

#### Scenario: The index list cannot be loaded

- **WHEN** the index list request fails
- **THEN** the panel reports the list as unavailable with a way to retry, and the
  composer still accepts a prompt

### Requirement: Recent conversation history

The side panel SHALL list the signed-in user's recent conversations for the
current agent, most recent activity first, identified by title where one exists.
Selecting a conversation SHALL replace the page's conversation with its stored
turns and SHALL direct subsequent runs at that conversation. The panel SHALL offer
starting a fresh, empty conversation.

While a stored conversation is being fetched the page SHALL indicate that it is
loading, and SHALL NOT accept a prompt against a conversation it has not yet
applied.

A user with no stored conversation, and a user whose identity cannot own stored
conversations, SHALL both still be able to hold a conversation on the page; only
the stored list is unavailable to them.

#### Scenario: A recent conversation is selected

- **WHEN** the user selects a conversation from the panel
- **THEN** its stored turns replace the page's conversation in their stored order,
  and the next prompt continues that same conversation rather than starting a new
  one

#### Scenario: The list is ordered by recency

- **WHEN** the panel lists more than one conversation
- **THEN** the one with the most recent activity is listed first

#### Scenario: A fresh conversation is started

- **WHEN** the user starts a new conversation from the panel
- **THEN** the page's conversation is emptied and the next prompt creates a new
  stored conversation

#### Scenario: The user has no stored conversation

- **WHEN** the signed-in user has no stored conversation, or cannot own one
- **THEN** the panel reports an empty list without an error, and the composer
  still accepts a prompt

#### Scenario: The list cannot be loaded

- **WHEN** the conversation list request fails
- **THEN** the panel reports the list as unavailable with a way to retry, and the
  composer still accepts a prompt
