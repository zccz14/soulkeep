import { useMemo } from 'react';
import { ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Skeleton } from '../api';
import { layoutSkeleton } from '../graph';

const MAX_HEIGHT = 620;

/** 骨架画成一张关系图：能缩放、能拖，看大的产品也不至于挤成一团。 */
export function SkeletonGraph({ skeleton }: { skeleton: Skeleton }) {
  const diagram = useMemo(() => layoutSkeleton(skeleton), [skeleton]);

  if (diagram.nodes.length === 0) return null;

  const height = Math.min(MAX_HEIGHT, Math.max(240, diagram.height + 20));

  return (
    <figure className="flex flex-col gap-2 border-t border-border pt-3">
      <div className="overflow-hidden rounded-lg border border-border bg-background" style={{ height }}>
        <ReactFlow
          colorMode="system"
          defaultEdgeOptions={{ type: 'smoothstep' }}
          edges={diagram.edges}
          edgesFocusable={false}
          elementsSelectable={false}
          fitView
          fitViewOptions={{ padding: 0.04, maxZoom: 1 }}
          minZoom={0.25}
          nodes={diagram.nodes}
          nodesConnectable={false}
          nodesDraggable={false}
          nodesFocusable={false}
          proOptions={{ hideAttribution: true }}
        >
        </ReactFlow>
      </div>
      <figcaption className="text-xs text-muted-foreground">
        方框是实体，线上的「1 : N」是一对多；带 ↻ 的实体指回自己。可以滚轮缩放、按住拖动画布。
      </figcaption>
    </figure>
  );
}
