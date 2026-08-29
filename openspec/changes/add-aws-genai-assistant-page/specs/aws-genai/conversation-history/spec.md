## Purpose

Defines how the `aws-genai` backend stores and returns a user's conversations with
an agent: what a completed run persists, how a conversation is titled and listed,
how its turns are read back so a client can show them, and on what terms a
conversation is continued or ended.

## ADDED Requirements

### Requirement: Persisting the turns of a run

A run that produced a reply SHALL store, against its session, the user's prompt
and the assistant's reply in the order they occurred, together with the tool
invocations the run reported. Turns SHALL be stored so that reading them back
yields the conversation in its original order.

A run cancelled before any reply text arrived SHALL store no turn. A run that
failed after some reply text arrived SHALL store what arrived, marked as
interrupted, so a later reader can tell it apart from a complete answer.

A failure to store SHALL NOT fail the run: the reply SHALL still reach the client.

Turns SHALL be stored only for a session owned by an authenticated end user.

#### Scenario: A completed run is stored

- **WHEN** a run answers a prompt and terminates without failure
- **THEN** the prompt and the reply are stored against that session, in that
  order, with the invocations the run reported

#### Scenario: A cancelled run stores nothing

- **WHEN** a run is cancelled before any reply text arrived
- **THEN** no turn is stored for it and the session's stored turns are unchanged

#### Scenario: An interrupted run is stored as interrupted

- **WHEN** a run fails after some reply text arrived
- **THEN** the stored reply is marked interrupted rather than complete

#### Scenario: Storing fails

- **WHEN** storing the turns fails after the reply was produced
- **THEN** the failure is logged and the client still receives the whole reply

#### Scenario: The caller is not an end user

- **WHEN** a run is made with credentials that are not an authenticated end
  user's
- **THEN** the reply is produced and no turn is stored

### Requirement: Titling a conversation

A conversation SHALL carry a title derived from the first prompt of its session,
reduced to a single line and clipped to a bounded length. The title SHALL be set
once and SHALL NOT be rewritten by later turns.

#### Scenario: A title is derived

- **WHEN** the first prompt of a session is stored
- **THEN** the conversation carries a title derived from that prompt

#### Scenario: The title is stable

- **WHEN** further turns are stored in a session that already has a title
- **THEN** the title is unchanged

#### Scenario: A long or multi-line prompt

- **WHEN** the first prompt spans several lines or exceeds the title length
- **THEN** the title is a single line within the bounded length

### Requirement: Listing a user's recent conversations

The backend SHALL expose an endpoint listing the conversations of the signed-in
user for a named agent, ordered by most recent activity first, each carrying its
identifier, its title where one exists, and its activity timestamp. The list SHALL
be bounded in size, and SHALL contain only conversations owned by the calling user.

A user with no conversation SHALL receive an empty list rather than an error.

#### Scenario: Conversations are listed newest first

- **WHEN** the signed-in user has several conversations with an agent
- **THEN** they are returned ordered by most recent activity first, each with its
  identifier, title and activity timestamp

#### Scenario: Another user's conversations are excluded

- **WHEN** another user has conversations with the same agent
- **THEN** they are absent from the calling user's list

#### Scenario: The user has no conversation

- **WHEN** the signed-in user has no conversation with the agent
- **THEN** the response is an empty list

#### Scenario: The list is bounded

- **WHEN** the user has more conversations than the endpoint returns at once
- **THEN** the response is bounded and carries the most recent ones

### Requirement: Reading a conversation's turns

The backend SHALL expose an endpoint returning the stored turns of one
conversation, in their stored order, each carrying its role, its text and the tool
invocations recorded with it, and marking an interrupted reply as such.

A conversation the calling user does not own SHALL NOT be readable, and SHALL be
answered the way an unknown conversation is.

#### Scenario: A conversation is read back

- **WHEN** the owning user reads a conversation holding two prompts and two
  replies
- **THEN** the four turns are returned in their stored order with their roles,
  texts and recorded invocations

#### Scenario: An interrupted reply is marked

- **WHEN** a conversation holds a reply stored as interrupted
- **THEN** the returned turn is marked interrupted

#### Scenario: Another user's conversation

- **WHEN** a user reads a conversation owned by another user
- **THEN** the request is refused and no turn is disclosed

#### Scenario: An unknown conversation

- **WHEN** a user reads a conversation identifier that does not exist
- **THEN** the request is answered as a missing conversation rather than an error

### Requirement: Continuing and ending a conversation

A run carrying the identifier of a conversation the user owns SHALL continue that
conversation: its turns SHALL be appended to the same conversation, and the agent
SHALL answer with the memory it holds for it.

A conversation the user ended SHALL NOT be offered as continuable, and its turns
SHALL remain readable unless the conversation itself was removed.

#### Scenario: A conversation is continued

- **WHEN** a run carries the identifier of the user's existing conversation
- **THEN** the new turns are appended to that conversation and its activity
  timestamp advances

#### Scenario: A conversation is ended

- **WHEN** the user ends a conversation
- **THEN** it is no longer offered as continuable, while its stored turns remain
  readable

#### Scenario: A conversation of another user is named

- **WHEN** a run carries the identifier of a conversation the user does not own
- **THEN** the run is refused rather than answered against that conversation
