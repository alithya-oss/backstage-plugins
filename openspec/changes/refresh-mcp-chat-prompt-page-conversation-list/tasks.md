Requirement references are to `specs/mcp-chat/prompt-page/spec.md`. All commands
run from `workspaces/mcp-chat` unless stated otherwise.

## 1. Report a persisted conversation

Covers _Selecting an existing conversation_.

- [x] 1.1 Add an optional `onConversationPersisted` to `UsePromptThreadOptions`
      and hold it in a ref, as `enabledServerIds` already is, so a run started
      before the latest render still calls the current callback.
- [x] 1.2 Invoke it from the `complete` branch of the stream loop with the
      reported conversation id, for a created and an appended-to conversation
      alike. Leave the `error`, abort and premature-end paths untouched —
      scenario _A failed run leaves the list alone_.

## 2. Refresh the list

- [x] 2.1 Pass `useConversations().refreshConversations` as the hook's
      `onConversationPersisted` in `PromptPageContent`.
- [x] 2.2 Extend `PromptPageContent.test.tsx`: a run whose stream reports a new
      conversation id makes the list show it — scenario _A run's conversation
      joins the list_ — and a run that fails leaves the list fetched once,
      scenario _A failed run leaves the list alone_. Both were confirmed to fail
      against the unwired page before the wiring was added.
- [x] 2.3 Extend `usePromptThread.test.tsx` to assert the callback fires once per
      completed run, with the reported id, including when the run continued an
      existing conversation.

## 3. Release artifacts

- [x] 3.1 Add a changeset for `@alithya-oss/backstage-plugin-mcp-chat`.
- [x] 3.2 Regenerate the API report: `rm -rf dist-types`, `yarn tsc`,
      `yarn build:api-reports:only`, then verify with
      `yarn build:api-reports:only --ci`. `report.api.md` came back unchanged —
      the hook is not part of the published surface.
- [x] 3.3 `CI=true yarn test plugins/mcp-chat` (705 tests), `yarn tsc:full`,
      `yarn lint --fix`.
