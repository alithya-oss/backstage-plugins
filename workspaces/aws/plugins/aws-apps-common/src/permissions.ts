// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { createPermission } from '@backstage/plugin-permission-common';

/**
 * Resource type identifier for AWS app components used in permission rules.
 *
 * @public
 */
export const APP_COMPNENT_RESOURCE_TYPE = 'aws-apps';

/**
 * Permission to read audit records for AWS app components.
 *
 * @public
 */
export const readOpaAppAuditPermission = createPermission({
  name: 'opa.app.audit.read',
  attributes: {
    action: 'read',
  },
  resourceType: APP_COMPNENT_RESOURCE_TYPE,
});

/**
 * Collection of all OPA-related permissions.
 *
 * @public
 */
export const opaPermissions = [readOpaAppAuditPermission];
