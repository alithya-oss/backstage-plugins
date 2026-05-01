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
import { Entity } from '@backstage/catalog-model';
import { isArgoWorkflowsAvailable } from './utils';
import {
  ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION,
  ARGO_WORKFLOWS_INSTANCE_ANNOTATION,
} from './annotations';

function createEntity(annotations?: Record<string, string>): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-entity',
      ...(annotations !== undefined ? { annotations } : {}),
    },
  };
}

describe('annotations', () => {
  it('should export the correct workflow-selector annotation key', () => {
    expect(ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION).toBe(
      'argoworkflows.argoproj.io/workflow-selector',
    );
  });

  it('should export the correct instance-name annotation key', () => {
    expect(ARGO_WORKFLOWS_INSTANCE_ANNOTATION).toBe(
      'argoworkflows.argoproj.io/instance-name',
    );
  });
});

describe('isArgoWorkflowsAvailable', () => {
  it('returns true when the workflow-selector annotation is present and non-empty', () => {
    const entity = createEntity({
      [ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION]: 'app=my-service',
    });
    expect(isArgoWorkflowsAvailable(entity)).toBe(true);
  });

  it('returns false when the entity has no annotations', () => {
    const entity = createEntity();
    expect(isArgoWorkflowsAvailable(entity)).toBe(false);
  });

  it('returns false when the entity has an empty annotations object', () => {
    const entity = createEntity({});
    expect(isArgoWorkflowsAvailable(entity)).toBe(false);
  });

  it('returns false when the annotation value is an empty string', () => {
    const entity = createEntity({
      [ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION]: '',
    });
    expect(isArgoWorkflowsAvailable(entity)).toBe(false);
  });

  it('returns false when the annotation value is only whitespace', () => {
    const entity = createEntity({
      [ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION]: '   ',
    });
    expect(isArgoWorkflowsAvailable(entity)).toBe(false);
  });

  it('returns true when the annotation value has leading/trailing whitespace but non-empty content', () => {
    const entity = createEntity({
      [ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION]: '  app=my-service  ',
    });
    expect(isArgoWorkflowsAvailable(entity)).toBe(true);
  });

  it('returns false when a different annotation is present but not the workflow-selector', () => {
    const entity = createEntity({
      [ARGO_WORKFLOWS_INSTANCE_ANNOTATION]: 'main',
    });
    expect(isArgoWorkflowsAvailable(entity)).toBe(false);
  });
});
