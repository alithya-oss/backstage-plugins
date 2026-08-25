---
'@alithya-oss/backstage-plugin-mcp-chat': minor
---

The Assistant UI prompt page at `/mcp-chat-prompt` now has a working
conversation surface, built on `@assistant-ui/react` primitives and styled with
CSS modules over Backstage UI design tokens.

The composer accepts multi-line text, submits on Enter and inserts a newline on
Shift+Enter. A blank or whitespace-only prompt starts no run. The assistant reply
is rendered as markdown while it is still growing, so text is readable before the
run ends — and a provider without native streaming, whose whole reply arrives as
one fragment, takes exactly the same path.

While a run is in flight the page says the assistant is working and offers a
cancel control in place of the send control; both follow the runtime's state, so
they clear when the run completes, fails or is cancelled. A failed run is
reported as an alert beside the conversation rather than as assistant content,
wording an unreachable backend differently from a provider failure, and offers a
retry that re-runs the last prompt. Text that had already arrived when a run
failed is kept and labelled as interrupted instead of being retracted or passed
off as a complete answer.

MCP tool call rendering and the reduced side panel land in follow-ups; the
existing `/mcp-chat` page is unchanged.
