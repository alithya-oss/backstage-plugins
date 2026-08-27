## Purpose

Defines how the prompt page treats a conversation as a tree rather than a list:
what happens when a user revises an earlier turn or regenerates an answer, how
alternatives are navigated without losing track of which one is shown, and what a
page reload restores.

## ADDED Requirements

### Requirement: Non-destructive revision

Editing an earlier user turn SHALL NOT discard the turns that followed it. The
edited text SHALL be recorded as an alternative to the turn it replaces, sharing
that turn's position in the conversation, and a run SHALL start from the edited
text. The exchanges that followed the original turn SHALL remain reachable as
another alternative at that same position.

The conversation the run is given as context SHALL be the path leading to the
edited turn, so a fork never carries the abandoned branch's content into the
provider request.

#### Scenario: An earlier turn is edited

- **WHEN** a conversation holds four exchanges and the user edits the text of the
  second user turn and confirms
- **THEN** a run starts from the edited text, the answer to it becomes the shown
  answer at that position, and the two exchanges that previously followed remain
  reachable as an alternative rather than being removed

#### Scenario: The edited turn's context excludes the abandoned branch

- **WHEN** a run starts from an edited earlier turn
- **THEN** the conversation sent with that run contains only the turns preceding
  the edited one plus the edited text itself

#### Scenario: The latest turn is edited

- **WHEN** the user edits the most recent user turn, which has no turns after it
- **THEN** a run starts from the edited text as an alternative to that turn, and
  the answer it previously received remains reachable

### Requirement: Regenerating an answer

Regenerating the answer to a user turn SHALL add a new answer alongside the
existing one rather than replacing it, and SHALL make the new answer the one
shown. The previous answer, together with everything that followed it, SHALL
remain reachable as an alternative.

Retrying after a failed run SHALL behave the same way: the failed attempt is kept
as an alternative rather than discarded, so a user can read the error that
occurred after a successful retry.

#### Scenario: An answer is regenerated

- **WHEN** the user regenerates the answer to a user turn that already has one
- **THEN** a run starts from that same prompt, its answer becomes the shown one,
  and the previous answer is still reachable as an alternative to it

#### Scenario: A regenerated answer keeps the earlier answer's tool results

- **WHEN** the previous answer had invoked MCP tools and the user regenerates it
- **THEN** the previous answer keeps its own tool invocations and their results,
  and moving back to it re-runs no tool

#### Scenario: A failed run is retried

- **WHEN** a run fails and the user retries it, and the retry succeeds
- **THEN** the successful answer is the one shown, and the failed attempt is
  reachable as an alternative rather than removed from the conversation

### Requirement: Moving between alternatives

Where a position in the conversation holds more than one alternative, the page
SHALL let the user move between them. Moving to another alternative SHALL replace
everything shown below that position with the exchanges belonging to the
alternative selected, and the next prompt SHALL continue from that alternative
rather than from the one previously shown.

Navigation SHALL NOT be offered while a run is in flight, so a switch cannot
land the arriving reply on a position the user has left.

#### Scenario: Moving between alternatives

- **WHEN** a position holds two alternatives and the user moves to the other one
- **THEN** the exchanges below that position are replaced by the ones belonging
  to the selected alternative

#### Scenario: A prompt continues the selected alternative

- **WHEN** the user moves to an alternative and then submits a new prompt
- **THEN** the new turn is appended below the selected alternative, and the
  alternative that was previously shown is unaffected

#### Scenario: A run is in flight

- **WHEN** a run is in flight
- **THEN** moving between alternatives is unavailable until the run completes,
  fails or is cancelled

### Requirement: Branch orientation

The page SHALL make it evident which alternative is shown, without requiring the
user to hover or interact to find out. A position holding alternatives SHALL
display its own position among them and the number available.

When the user moves to another alternative, the page SHALL indicate that the
exchanges below that position changed rather than replacing them silently.

When the shown path is not the most recently created one, the page SHALL say so
and SHALL offer returning to the most recently created path in one action.

#### Scenario: A position with alternatives is displayed

- **WHEN** a position holds more than one alternative
- **THEN** its position among them and their total are visible on the page
  without hovering over or interacting with the turn

#### Scenario: A position with no alternative

- **WHEN** a position holds exactly one answer
- **THEN** no navigation control and no position indicator are shown for it

#### Scenario: The shown path is not the newest

- **WHEN** the user moves to an alternative that is not the most recently created
  one
- **THEN** the page states that a newer path exists and offers returning to it
  in one action

#### Scenario: Switching signals what changed

- **WHEN** the user moves to another alternative and the exchanges below the
  switch point differ
- **THEN** the page indicates that those exchanges changed as a result of the
  switch

### Requirement: Cancelling a run in a branched conversation

Cancelling a run SHALL leave the conversation on the path the run was started
from, and SHALL NOT remove any alternative that existed before the run. A
cancelled attempt SHALL NOT be left shown as still running, and the user SHALL be
able to submit again on that same path.

#### Scenario: A regeneration is cancelled

- **WHEN** the user regenerates an answer and cancels the run before it completes
- **THEN** the previously shown answer is shown again, no alternative is lost,
  and no turn is left marked as running

#### Scenario: A fork is cancelled

- **WHEN** the user edits an earlier turn and cancels the resulting run before
  any reply arrives
- **THEN** the conversation returns to the path shown before the edit, and the
  exchanges that followed the original turn are shown again

### Requirement: Branches survive a reload

Reloading the page, or leaving it and selecting the same conversation again,
SHALL restore every alternative the conversation holds, not only the path that
was shown. The path restored SHALL be the one the owner last viewed.

Selecting an alternative SHALL be recorded even when it starts no run, so the
choice is what a later reload restores.

#### Scenario: Alternatives are restored

- **WHEN** a conversation holding two alternatives at one position is reloaded
- **THEN** that position still reports two alternatives and the user can move
  between them

#### Scenario: The last viewed path is restored

- **WHEN** the user moves to an alternative, starts no run, and later reopens the
  conversation
- **THEN** the path shown is the alternative the user had moved to

#### Scenario: A conversation with no alternatives is restored

- **WHEN** a conversation that holds a single path is reopened
- **THEN** its turns are shown in order and no navigation control appears
