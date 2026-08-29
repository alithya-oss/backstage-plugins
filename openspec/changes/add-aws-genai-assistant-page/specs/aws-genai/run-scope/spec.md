## Purpose

Defines the contract the `aws-genai` backend exposes so a client can see and
choose what one chat run may reach: which of the agent's registered tools it may
use, which search indexes those tools may read, how that choice is enforced on the
tools handed to the agent, and how tool invocations report their outcome — without
changing the behaviour of a request that asks for none of it.

## ADDED Requirements

### Requirement: Advertising an agent's tools

The backend SHALL expose an endpoint reporting the tools a named agent may use:
the actions of the MCP actions registry that the agent's configured allowlist
names, each with its name, a human-readable title and its description. An action
named in the allowlist but absent from the registry SHALL be omitted rather than
reported as available, and SHALL be logged.

The endpoint SHALL resolve the caller's credentials the same way the chat endpoint
does, and SHALL answer for an unknown agent the way the other agent-scoped
endpoints answer for one.

#### Scenario: An agent's tools are listed

- **WHEN** a client requests the tools of an agent whose allowlist names two
  registered actions
- **THEN** the response lists exactly those two, each with its name, title and
  description

#### Scenario: A configured action is not registered

- **WHEN** the agent's allowlist names an action no module registered
- **THEN** that action is absent from the response and the omission is logged, and
  the remaining actions are still listed

#### Scenario: The agent is unknown

- **WHEN** a client requests the tools of an agent that is not configured
- **THEN** the request is rejected rather than answered with an empty list

### Requirement: Per-run tool selection

The chat request MAY carry the set of tools enabled for that run. Where it does,
only the actions in that set **and** in the agent's configured allowlist SHALL be
offered to the agent for that run. A name in the set that the allowlist does not
grant SHALL be ignored rather than granted.

Where the request carries no such set, every action the allowlist grants SHALL be
offered, so a client that does not know the field behaves exactly as before this
change. Where it carries an empty set, no action SHALL be offered and the run
SHALL still proceed.

#### Scenario: A subset of tools is enabled

- **WHEN** a run enables one of the two actions the allowlist grants
- **THEN** only that action is offered to the agent for that run

#### Scenario: An ungranted tool is requested

- **WHEN** a run enables an action the agent's allowlist does not grant
- **THEN** that action is not offered to the agent, and the granted actions in the
  set still are

#### Scenario: The field is absent

- **WHEN** a run carries no enabled tool set
- **THEN** every action the allowlist grants is offered, as before this change

#### Scenario: No tool is enabled

- **WHEN** a run carries an empty enabled tool set
- **THEN** the agent is offered no action and the run still produces a reply

### Requirement: Advertising search indexes

The backend SHALL expose an endpoint reporting the search indexes a named agent's
tools may reach: for each, the index type, a human-readable title, and whether any
tool available to that agent covers it. The set of indexes SHALL be read from
configuration, and where configuration declares none the backend SHALL report the
indexes its own built-in search actions cover.

#### Scenario: The configured indexes are listed

- **WHEN** configuration declares two search indexes and a client requests them
  for an agent
- **THEN** the response lists both, each with its type and title

#### Scenario: No index is configured

- **WHEN** configuration declares no search index
- **THEN** the response lists the indexes the built-in search actions cover

#### Scenario: An index no tool of the agent covers

- **WHEN** configuration declares an index whose actions the agent's allowlist
  does not grant
- **THEN** the response reports that index as not covered by this agent's tools

### Requirement: Per-run search index scoping

The chat request MAY carry the set of search indexes enabled for that run. Where
it does, no tool offered to the agent SHALL be able to read a document from an
index outside that set. Enforcement SHALL be applied to the tools handed to the
agent, not left to the agent's judgement:

- a tool all of whose declared indexes are disabled SHALL be withheld from the
  run;
- a tool that takes its index as an argument SHALL have that argument restricted
  to the enabled indexes, and SHALL default to them where the argument is omitted.

Where the request carries no such set, no restriction SHALL be applied, so a
client that does not know the field behaves exactly as before this change. Where it
carries an empty set, every tool that reads a search index SHALL be withheld and
the run SHALL still proceed.

#### Scenario: A tool bound to a disabled index is withheld

- **WHEN** a run disables the only index a tool declares
- **THEN** that tool is not offered to the agent for that run

#### Scenario: A multi-index tool is narrowed

- **WHEN** a run enables one of the two indexes a tool declares
- **THEN** that tool is offered, its index argument accepts only the enabled
  index, and an invocation that omits the argument searches only the enabled index

#### Scenario: A disabled index is requested by the agent

- **WHEN** the agent invokes a narrowed tool asking for a disabled index
- **THEN** the invocation does not return a document from that index

#### Scenario: The field is absent

- **WHEN** a run carries no enabled index set
- **THEN** every search tool behaves as before this change, searching the index it
  has always searched

#### Scenario: No index is enabled

- **WHEN** a run carries an empty enabled index set
- **THEN** no tool that reads a search index is offered and the run still produces
  a reply

### Requirement: Reporting tool invocation outcomes

The run's event stream SHALL be able to report the outcome of a tool invocation:
an event carrying the invocation's identifier, its result, and whether it failed.
An invocation's start event SHALL carry the same identifier, so a client can fill
the invocation it already showed rather than showing it twice. An outcome event
SHALL NOT precede the start event bearing the same identifier.

Because an existing client rejects an event type it does not know, the backend
SHALL emit outcome events, and identifiers on start events, only to a request that
declared it understands them. A request that did not SHALL receive exactly the
event shapes it received before this change.

#### Scenario: A run opts into outcomes

- **WHEN** a run that declared it understands outcome events invokes a tool
- **THEN** the stream carries the invocation's start event with an identifier
  followed by an outcome event bearing the same identifier

#### Scenario: A failing invocation

- **WHEN** an invoked tool returns an error on a run that opted in
- **THEN** the outcome event marks that invocation as failed and the run continues

#### Scenario: A run does not opt in

- **WHEN** a run that did not declare it understands outcome events invokes a tool
- **THEN** the stream carries the start event in its pre-existing shape and no
  outcome event

### Requirement: Compatibility of the existing chat contract

A chat request carrying none of the fields this capability adds SHALL be handled
exactly as before this change: the same event types, in the same order, with the
same tools offered to the agent. The generate endpoint, the MCP server endpoint and
the session endpoints SHALL be unaffected.

#### Scenario: An older client chats

- **WHEN** a client posts a chat request carrying only the fields that existed
  before this change
- **THEN** the run behaves as it did before this change, and the stream carries
  only event shapes that client already knows

#### Scenario: The other endpoints are unaffected

- **WHEN** a client uses the generate, MCP server or session endpoints
- **THEN** they behave exactly as before this change
