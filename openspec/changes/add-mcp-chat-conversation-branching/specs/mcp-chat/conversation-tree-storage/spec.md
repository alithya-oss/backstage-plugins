## Purpose

Defines how a branched conversation is stored and read back: the tree of turns
and the path last viewed, the linear projection kept so callers that predate
branching keep working, how a conversation stored before branching existed is
read, and the bounds on how large a branched conversation may grow.

## ADDED Requirements

### Requirement: A stored conversation carries its tree and its head

A stored conversation SHALL carry every turn it holds, each identified and each
naming the turn it follows, together with the identifier of the turn the owner
last viewed. Turns that share a predecessor SHALL be stored as alternatives of one
another; no alternative SHALL be dropped when another is chosen.

A stored turn SHALL carry the MCP tool invocations that were made while producing
it, with their arguments and their results, so a stored alternative can be shown
again without re-invoking any tool.

#### Scenario: A branched conversation is stored and read back

- **WHEN** a conversation in which one position holds two alternatives is stored
  and then read back
- **THEN** both alternatives are present, each names the turn it follows, and the
  turn last viewed is reported

#### Scenario: A stored turn keeps its tool results

- **WHEN** a turn whose production invoked MCP tools is stored and read back
- **THEN** its invocations are present with their arguments and results, and
  reading it invokes no tool

#### Scenario: The head is recorded without a run

- **WHEN** the owner selects an alternative and starts no run
- **THEN** the conversation's recorded head becomes that alternative, and the
  turns already stored are unchanged

### Requirement: A run is stored under the turn it was started from

A run SHALL state which stored turn its new turns follow. The run's user turn and
its answer SHALL be stored as alternatives under that turn rather than appended to
whatever path was last stored, and the conversation's head SHALL become the
answer produced.

A run that names no predecessor SHALL be stored under the conversation's current
head, so a caller that does not know about branching keeps appending linearly.

#### Scenario: A run forks from an earlier turn

- **WHEN** a run names an earlier stored turn as its predecessor
- **THEN** its user turn is stored as an alternative under that turn, the answer
  is stored under the new user turn, and the head becomes that answer

#### Scenario: A run names no predecessor

- **WHEN** a run names no predecessor
- **THEN** its turns are stored under the conversation's current head

#### Scenario: A run names a predecessor that does not exist

- **WHEN** a run names a predecessor absent from the stored conversation
- **THEN** the run is stored under the current head rather than rejected, and the
  conversation stays readable

### Requirement: A linear projection is kept for callers that predate branching

Alongside the tree, a stored conversation SHALL keep the path from its first turn
to its head as a plain ordered list of messages, in the shape callers used before
branching existed. That list SHALL be rewritten whenever the tree or the head
changes, so the two never disagree about what the visible path is.

The tree SHALL be the authoritative representation for the branching page; the
list SHALL be a derived view. A caller reading only the list SHALL see a
coherent, complete conversation — the path last viewed — and SHALL NOT be able to
observe a partially written state.

#### Scenario: The projection follows the head

- **WHEN** the owner moves the head to another alternative
- **THEN** the stored list becomes the path leading to that alternative

#### Scenario: A caller that predates branching reads the conversation

- **WHEN** a caller that knows nothing of the tree reads a branched conversation
- **THEN** it reads the path last viewed as an ordered list of messages, with no
  error and no reference to the alternatives

### Requirement: A conversation stored before branching is read as a single path

A conversation stored without a tree SHALL be read as a conversation whose turns
form a single path, each turn following the one before it, with the last turn as
the head. This SHALL require no data rewrite and SHALL happen on every read until
the conversation is next written.

The first write to such a conversation SHALL store its tree, so the conversion
completes without an adopter running a data migration.

#### Scenario: A conversation stored before branching is opened

- **WHEN** a conversation stored before branching existed is opened on the
  branching page
- **THEN** its turns are shown in their stored order, no position reports
  alternatives, and the page is usable

#### Scenario: A conversation stored before branching is continued

- **WHEN** the owner submits a prompt in such a conversation
- **THEN** the conversation is stored with a tree from then on, and its previously
  stored turns are preserved in the same order

#### Scenario: An empty conversation is read

- **WHEN** a stored conversation holds no turns
- **THEN** it is read as a conversation with no turns and no head, without error

### Requirement: A conversation stays readable when its tree cannot be used

A stored tree that cannot be read — malformed, or written by a newer version than
the reader understands — SHALL NOT make the conversation unreadable. The reader
SHALL fall back to the stored linear path, SHALL report the conversation as
holding a single path, and SHALL record the fault for the operator.

A stored conversation SHALL NOT be rejected, emptied or deleted because its tree
is unusable.

#### Scenario: The stored tree is malformed

- **WHEN** a conversation's stored tree cannot be interpreted
- **THEN** its linear path is returned instead, the conversation reports no
  alternatives, and the fault is logged

#### Scenario: The stored tree names a turn that does not exist

- **WHEN** a stored tree names a predecessor or a head that is not among its turns
- **THEN** the conversation is returned as a single path rather than as a broken
  tree, and the fault is logged

#### Scenario: Storing the tree fails

- **WHEN** storing a conversation's tree fails
- **THEN** the run that produced it still completes for the user, and the failure
  does not surface as a failed answer

### Requirement: Branching is abandoned rather than corrupted by a writer that ignores it

When a conversation's linear path is rewritten by a caller that does not
understand the tree, the stored tree SHALL be discarded rather than left
describing turns the list no longer contains. The conversation SHALL then read as
a single path, and SHALL be able to gain a tree again on a later branching write.

#### Scenario: The conversation is continued from a caller that ignores the tree

- **WHEN** a branched conversation's linear path is rewritten by a caller that
  does not understand the tree
- **THEN** the stored tree is discarded, the conversation reads as the single path
  that caller wrote, and no turn of that path is lost

#### Scenario: The conversation is branched again afterwards

- **WHEN** such a conversation is later continued from the branching page
- **THEN** it gains a tree again, lifted from the path stored at that moment

### Requirement: Bounded growth of a branched conversation

Because no alternative is discarded, a stored conversation SHALL have a bound on
the number of turns it retains, configurable by the adopter with a documented
default. When the bound is reached, the turns retained SHALL be the path leading
to the head plus the most recently created alternatives; older alternatives that
are not on that path SHALL be dropped, oldest first.

Dropping an alternative SHALL never break the conversation: the path leading to
the head SHALL always be retained in full, whatever the bound.

#### Scenario: The bound is reached

- **WHEN** storing a conversation would exceed the configured bound
- **THEN** alternatives that are not on the path to the head are dropped oldest
  first until the conversation fits, and that path is retained in full

#### Scenario: The path to the head alone exceeds the bound

- **WHEN** the path leading to the head is itself larger than the bound
- **THEN** it is retained in full rather than truncated, and no alternative is
  retained

#### Scenario: The bound is not configured

- **WHEN** an adopter configures no bound
- **THEN** a documented default applies
