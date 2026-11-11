import { useCallback, useMemo, useState } from 'react';
import { ReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Skeleton } from '../api';
import { layoutSkeleton } from '../graph';
import { RelationEdge } from './relation-edge';

const MAX_HEIGHT = 620;
const edgeTypes = { relation: RelationEdge };

/** 骨架画成一张关系图：实体是方框，箭头指出方向，两端写着「1」和「N」。 */
export function SkeletonGraph({ skeleton }: { skeleton: Skeleton }) {
  const diagram = useMemo(() => layoutSkeleton(skeleton), [skeleton]);
  const [focus, setFocus] = useState<string | null>(null);

  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>(diagram.nodes.map((node) => [node.id, new Set<string>()]));
    for (const edge of diagram.edges) {
      map.get(edge.source)?.add(edge.target);
      map.get(edge.target)?.add(edge.source);
    }
    return map;
  }, [diagram]);

  const lit = useCallback(
    (name: string) => focus === null || name === focus || (neighbors.get(focus)?.has(name) ?? false),
    [focus, neighbors],
  );

  const nodes = useMemo<Node[]>(
    () =>
      diagram.nodes.map((node) => ({
        ...node,
        style: { ...node.style, opacity: lit(node.id) ? 1 : 0.25 },
      })),
    [diagram, lit],
  );

  const edges = useMemo<Edge[]>(
    () =>
      diagram.edges.map((edge) => {
        const dim = !lit(edge.source) || !lit(edge.target);
        return {
          ...edge,
          data: { ...edge.data, dim },
          style: { ...edge.style, strokeOpacity: dim ? 0.12 : 0.6 },
        };
      }),
    [diagram, lit],
  );

  if (diagram.nodes.length === 0) return null;

  const height = Math.min(MAX_HEIGHT, Math.max(240, diagram.height + 20));

  return (
    <figure className="flex flex-col gap-2 border-t border-border pt-3">
      <div className="overflow-hidden rounded-lg border border-border bg-background" style={{ height }}>
        <ReactFlow
          colorMode="system"
          edgeTypes={edgeTypes}
          edges={edges}
          edgesFocusable={false}
          elementsSelectable={false}
          fitView
          fitViewOptions={{ padding: 0.04, maxZoom: 1 }}
          minZoom={0.25}
          nodes={nodes}
          nodesConnectable={false}
          nodesDraggable={false}
          nodesFocusable={false}
          onNodeClick={(_, node) => setFocus((current) => (current === node.id ? null : node.id))}
          onNodeMouseEnter={(_, node) => setFocus(node.id)}
          onNodeMouseLeave={() => setFocus(null)}
          onPaneClick={() => setFocus(null)}
          proOptions={{ hideAttribution: true }}
        />
      </div>
      <figcaption className="text-xs text-muted-foreground">
        方框是实体，箭头从「一」指向「多」；把鼠标放在实体上可以只看它的关系，滚轮缩放、拖动画布。
      </figcaption>
    </figure>
  );
}
