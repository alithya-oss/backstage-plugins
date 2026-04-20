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

import type {
  LayoutEdge,
  NodeStatus,
} from '@alithya-oss/backstage-plugin-argo-workflows-common';
import styles from './DAGEdgeSVG.module.css';

/**
 * Props for the DAGEdgeSVG component.
 * @public
 */
export interface DAGEdgeSVGProps {
  edges: LayoutEdge[];
  nodeMap: Map<string, NodeStatus>;
  width: number;
  height: number;
}

const FAILURE_PHASES = new Set(['Failed', 'Error']);
const SUCCESS_PHASES = new Set(['Succeeded']);

function getEdgeClass(sourcePhase: string): string {
  if (FAILURE_PHASES.has(sourcePhase)) return styles.danger;
  if (SUCCESS_PHASES.has(sourcePhase)) return styles.success;
  return styles.inactive;
}

function pointsToPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  const [start, ...rest] = points;
  let d = `M ${start.x} ${start.y}`;
  for (const p of rest) {
    d += ` L ${p.x} ${p.y}`;
  }
  return d;
}

/**
 * SVG overlay rendering edges between dagre-positioned nodes.
 *
 * @public
 */
export function DAGEdgeSVG({ edges, nodeMap, width, height }: DAGEdgeSVGProps) {
  return (
    <svg
      className={styles.svg}
      width={width}
      height={height}
      data-testid="dag-edge-svg"
    >
      {edges.map(edge => {
        const sourceNode = nodeMap.get(edge.source);
        const phase = sourceNode?.phase ?? 'Pending';
        return (
          <path
            key={`${edge.source}-${edge.target}`}
            className={`${styles.edgePath} ${getEdgeClass(phase)}`}
            d={pointsToPath(edge.points)}
            data-testid="dag-edge-path"
          />
        );
      })}
    </svg>
  );
}
