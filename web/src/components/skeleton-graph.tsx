import { useCallback, useMemo, useState } from 'react';
import { ReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Skeleton } from '../api';
import { layoutSkeleton } from '../graph';
import { SkeletonNode } from './skeleton-node';

const nodeTypes = { box: SkeletonNode };

const MAX_HEIGHT = 620;

/** 骨架画成一张有层次的图：越靠上是越被依赖的核心，越往下越边缘。 */
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
    () => diagram.nodes.map((node) => ({ ...node, style: { ...node.style, opacity: lit(node.id) ? 1 : 0.25 } })),
    [diagram, lit],
  );

  const edges = useMemo<Edge[]>(
    () =>
      diagram.edges.map((edge) => {
        const dim = !lit(edge.source) || !lit(edge.target);
        return {
          ...edge,
          style: { ...edge.style, strokeOpacity: dim ? 0.1 : (edge.style?.strokeOpacity ?? 0.55) },
        };
      }),
    [diagram, lit],
  );

  if (diagram.nodes.length === 0 && diagram.isolated.length === 0) return null;

  const height = Math.min(MAX_HEIGHT, Math.max(240, diagram.height + 20));

  return (
    <figure className="flex flex-col gap-2 border-t border-border pt-3">
      {diagram.nodes.length > 0 ? (
      <div className="overflow-hidden rounded-lg border border-border bg-background" style={{ height }}>
        <ReactFlow
          colorMode="system"
          defaultEdgeOptions={{ type: 'smoothstep' }}
          edges={edges}
          edgesFocusable={false}
          elementsSelectable={false}
          fitView
          fitViewOptions={{ padding: 0.04, maxZoom: 1 }}
          minZoom={0.25}
          nodeTypes={nodeTypes}
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
      ) : null}
      {diagram.isolated.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          没有任何关系的实体：<span className="font-mono">{diagram.isolated.join('、')}</span>
        </p>
      ) : null}
      <figcaption className="text-xs leading-relaxed text-muted-foreground">
        越靠上越核心：深色的是挂着别人的实体，越往下越边缘。实线箭头是从属（箭头指向被拥有的那一方），
        虚线是平级，点线是同一个东西的两半。指向自己的标 ↻。可以滚轮缩放、拖动画布，鼠标停在实体上只看它的关系。
      </figcaption>
    </figure>
  );
}
