# Actions and tools

## Registering actions

We can register Backstage actions as tools available to the agents to retrieve context or perform actions.

Any action available in Backstage is viable to be added as an action to an agent.

Update the previous agent definition to add the `actions` field:

```yaml
backend:
  actions:
    pluginSources:
      - 'catalog'
      - 'aws-genai'
genai:
  registerCoreActions: true
  agents:
    general:
      description: [...]
      prompt: [...]
      langgraph: [...]
      actions:
        - get-catalog-entity # This is built in to Backstage
        - search-catalog
        - search-techdocs
```

Also note the `genai.registerCoreActions` flag which has been enabled. This registers several actions related to "core" Backstage functions like the catalog and TechDocs. It is expected that when upstream Backstage makes general implementations of these actions available these will be removed.

These are the core actions provided:

| Tools name        | Description                                        |
| ----------------- | -------------------------------------------------- |
| `search-catalog`  | Search the Backstage catalog using the Search API  |
| `search-techdocs` | Search TechDocs documentation using the Search API |
| `read-techdocs`   | Reads a specific page of TechDocs documentation    |

You can find other actions from various plugins, such as the [CodePipeline plugin](https://github.com/awslabs/backstage-plugins-for-aws/blob/main/plugins/codepipeline/README.md#model-context-protocol-integration) from the upstream AWS plugins.

## Adding tools

WARNING: This mechanism is deprecated and will be removed soon. Please migrate any custom tools to the actions registry (see above).

We can provide tools/functions that can be called by agents to retrieve context or perform actions. Tools can be added to the agent using a Backstage extension point and packaged as NPM packages.

There are several tools built in to the plugin related to core Backstage functionality. The `backstageCatalogSearch`, `backstageEntity` and `backstageTechDocsSearch` tools to give the model basic access to the Backstage catalog and TechDocs documentation.

Update the previous agent definition to add the `tools` field:

```yaml
genai:
  agents:
    general:
      description: [...]
      prompt: [...]
      langgraph: [...]
      tools:
        - backstageCatalogSearch
        - backstageEntity
        - backstageTechDocsSearch
```

Restart Backstage to reload the configuration and try asking the chat assistant a question related to information in the your Backstage catalog, for example "Summarize <component name> from the Backstage catalog".

NOTE: After Backstage starts locally there can be a delay indexing the catalog and TechDocs for search. You will not receive search results until the index is built.

## Agents communicating

WARNING: When configuring agents to communicate with each other you must take care to ensure that agent interactions are behaving appropriately. Failing to do so can result in prolonged agent interactions, for example with looping behavior, that will consume a large number of LLM tokens.

A simple mechanism is provided to allow agents to communicate, which treats agents as tools. An action is added to the registry for each agent of the format `query-agent-<agent name>`.

You can provide these tools to agents:

```yaml
backend:
  actions:
    pluginSources:
      - 'aws-genai' # You need to enable the registration of actions from this plugin
genai:
  agents:
    general:
      description: [...]
      prompt: [...]
      langgraph: [...]
      actions:
        - query-agent-weather
    weather:
      description: [...]
      prompt: [...]
      langgraph: [...]
```

The tool for invoking agents simply accepts a parameter called `query` which is expected to be a natural language query, and it will respond with the raw text output of the agent.
