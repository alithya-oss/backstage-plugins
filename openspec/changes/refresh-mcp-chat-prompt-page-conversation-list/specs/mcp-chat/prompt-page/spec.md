## MODIFIED Requirements

### Requirement: Selecting an existing conversation

The page's side panel SHALL list the signed-in user's stored conversations, most
recently updated first, identified by title where one exists. Selecting a
conversation SHALL replace the page's conversation with its stored turns and
SHALL direct subsequent runs at that conversation. The panel SHALL offer
starting a fresh, empty conversation.

The list SHALL reflect the conversations a run on the page has persisted, without
the user reloading the page: a conversation a run created SHALL appear in the
list, and one a run appended to SHALL be re-ordered by its new update time. A run
that fails or is cancelled persists nothing and SHALL therefore leave the list
alone.

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

#### Scenario: A run's conversation joins the list

- **WHEN** a run completes and the backend reports the conversation it stored
- **THEN** the list shows that conversation, as the backend titled it, without
  the user reloading the page

#### Scenario: A continued conversation is re-ordered

- **WHEN** a run appends to the conversation the page is holding
- **THEN** the list shows it with its new update time, ahead of conversations
  updated earlier, and does not show it twice

#### Scenario: A failed run leaves the list alone

- **WHEN** a run fails or is cancelled
- **THEN** the list is unchanged, since nothing was stored

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
