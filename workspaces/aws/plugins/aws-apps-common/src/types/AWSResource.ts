// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * An AWS resource identified by ARN and type.
 *
 * @public
 */
export interface AWSResource {
  resourceTypeId: string;
  resourceTypeName: string;
  resourceName: string;
  resourceArn: string;
}

/**
 * A recorded audit event for an AWS operation.
 *
 * @public
 */
export interface AuditRecord {
  id: string;
  origin: string;
  actionType: string;
  actionName: string;
  appName: string;
  createdDate: string;
  createdAt: string;
  initiatedBy: string;
  owner: string;
  assumedRole: string;
  targetAccount: string;
  targetRegion: string;
  prefix: string;
  providerName: string;
  request: string;
  status: string;
  message: string;
}

/**
 * A binding between an application and an AWS resource.
 *
 * @public
 */
export interface ResourceBinding {
  id: string;
  resourceType: string;
  resourceName: string;
  provider: string;
  resourceArn: string;
  associatedResources?: AssociatedResources[];
  entityRef?: string;
}

/**
 * Resources associated with a resource binding.
 *
 * @public
 */
export interface AssociatedResources {
  resourceName: string;
  resourceType: string;
  resourceArn: string;
}

/**
 * Parameters for binding a resource to an application.
 *
 * @public
 */
export interface BindResourceParams {
  envName: string;
  providerName: string;
  resourceName: string;
  resourceEntityRef: string;
  policies: ResourcePolicy[];
  appName: string;
}

/**
 * An IAM policy associated with a resource binding.
 *
 * @public
 */
export interface ResourcePolicy {
  policyFileName: string;
  policyContent: string;
  policyResource: string;
}
