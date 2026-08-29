/*
 * Copyright 2026 The Alithya Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  AgentToolDescriptor,
  ChatRequest,
  ConversationSummary,
  ConversationTurn,
  SearchIndexDescriptor,
} from './types';

describe('ChatRequest', () => {
  it('is satisfied by a request carrying only the fields that predate run scope', () => {
    // The assignment is the assertion: it fails to compile if any run-scope
    // field became required.
    const request: ChatRequest = {
      userMessage: 'What owns the payments service?',
      sessionId: undefined,
      agentName: 'general',
    };

    expect(request.enabledActions).toBeUndefined();
    expect(request.enabledSearchIndexes).toBeUndefined();
    expect(request.toolResults).toBeUndefined();
  });

  it('carries the run scope and the tool outcome opt-in when a caller sets them', () => {
    const scoped: ChatRequest = {
      userMessage: 'What owns the payments service?',
      sessionId: 'session-1',
      agentName: 'general',
      enabledActions: ['search-catalog'],
      enabledSearchIndexes: [],
      toolResults: true,
    };

    expect(scoped.enabledActions).toEqual(['search-catalog']);
    // An empty array is a scope, not an absent field: no search tool is offered.
    expect(scoped.enabledSearchIndexes).toEqual([]);
    expect(scoped.toolResults).toBe(true);
  });
});

describe('catalogue and history payloads', () => {
  it('describes an agent tool, a search index, a conversation and its turns', () => {
    const tool: AgentToolDescriptor = {
      name: 'search-catalog',
      title: 'Search the catalog',
      description: 'Searches the Backstage software catalog',
    };
    const index: SearchIndexDescriptor = {
      type: 'software-catalog',
      title: 'Software Catalog',
      covered: true,
    };
    const conversation: ConversationSummary = {
      sessionId: 'session-1',
      title: 'What owns the payments service?',
      lastActivity: '2026-08-29T12:00:00.000Z',
    };
    const turns: ConversationTurn[] = [
      { role: 'user', content: 'What owns the payments service?' },
      {
        role: 'assistant',
        content: 'The payments team owns it',
        toolInvocations: [
          {
            id: 'invocation-1',
            name: 'search-catalog',
            input: '{"term":"payments"}',
            output: '{"results":[]}',
            isError: false,
          },
        ],
      },
      { role: 'assistant', content: 'The payments team ow', interrupted: true },
    ];

    expect(tool.description).toBeDefined();
    expect(index.covered).toBe(true);
    // A conversation is untitled until its first prompt is stored, and unended
    // until the user ends it.
    expect(conversation.ended).toBeUndefined();
    expect(turns[0].toolInvocations).toBeUndefined();
    expect(turns[1].toolInvocations).toHaveLength(1);
    expect(turns[1].interrupted).toBeUndefined();
    expect(turns[2].interrupted).toBe(true);
  });
});
