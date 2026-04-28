<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
-->

# AWS Apps Backend Plugin

## Overview

The AWS Apps Backend plugin is a core component of the AWS Apps on AWS solution, providing essential backend services that enable AWS Apps functionality within your Backstage instance. This plugin serves as a bridge between your Backstage application and various external services.

## Key Capabilities

The plugin provides backend methods to interact with:

- **AWS SDK Backend** - Calls AWS SDK APIs to manage and interact with AWS resources
- **Git Provider Backend** - Interfaces with git providers to query and manage repositories
- **Platform Backend** - Integrates with Backstage platform backend APIs

## Installation

```sh
# From your Backstage root directory
yarn add --cwd packages/backend @alithya-oss/backstage-plugin-aws-apps-backend@0.4.0
```

## Configuration

### Backend Integration

Configure your Backstage backend in `packages/backend/src/index.ts` to integrate with the AWS Apps backend plugin:

```diff
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();
...

+backend.add(import('@alithya-oss/backstage-plugin-aws-apps-backend'));

backend.start();
}
```

> **Note:** If you installed the complete AWS Apps platform suite, this configuration is automatically applied through git patches.

## Dependencies

This plugin depends on the following AWS Apps components:

- `@alithya-oss/backstage-plugin-aws-apps-common` - Shared utilities and types

Ensure these dependencies are properly installed and configured in your Backstage instance.
