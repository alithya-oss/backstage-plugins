## MODIFIED Requirements

### Requirement: Page availability alongside the existing chat page

The plugin SHALL expose the conversation page on its own route, distinct from
the route of the pre-existing chat page. Both pages SHALL remain independently
reachable and functional in the same application, and the new page SHALL be
mountable without altering the existing page's route, behaviour or appearance.

The page SHALL be mountable from either of the plugin's entry points — the one an
application on the current frontend system consumes and the one an application on
the previous frontend system consumes — and SHALL present the same conversation
surface through both, on the same route reference. Neither entry point SHALL
require the other to be mounted.

#### Scenario: Both pages are reachable

- **WHEN** an application mounts both the pre-existing chat page and the new
  conversation page
- **THEN** each is reachable at its own path, and using one leaves the other's
  behaviour unchanged

#### Scenario: The new page is not mounted

- **WHEN** an application upgrades the plugin but mounts only the pre-existing
  chat page
- **THEN** the application behaves exactly as before the upgrade

#### Scenario: The page is mounted from the previous frontend system

- **WHEN** an application on the previous frontend system mounts the conversation
  page from the plugin's entry point for that system
- **THEN** the page renders the same conversation surface, within the page chrome
  that system provides, and resolves to the same route reference as the other
  entry point
