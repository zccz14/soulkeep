import dagre from '@dagrejs/dagre';
import type { Edge, Node } from '@xyflow/react';
import type { Cardinality, Skeleton } from './api';

/**
 * 骨架画成一张关系图：实体是方框，关系是连线，线上写「几对几」。
 * 排版交给 dagre（分层、少交叉），画图交给 React Flow（缩放、拖动、悬停）。
 */
export interface Diagram {
  nodes: Node[];
  edges: Edge[];
  height: number;
}

const NODE_HEIGHT = 34;

export function labelOf(cardinality: Cardinality): string {
  if (cardinality === 'one-to-one') return '1 : 1';
  if (cardinality === 'one-to-many') return '1 : N';
  return 'N : M';
}

export function nodeWidth(name: string): number {
  // 12px 等宽字体大约每个字 7.3px，再留出两侧内边距；宁可宽一点，也别让名字顶出方框。
  return Math.max(96, name.length * 7.4 + 30);
}

export function layoutSkeleton(skeleton: Skeleton): Diagram {
  // multigraph：同一对实体之间可以有几条不同的关系，各画各的线。
  const graph = new dagre.graphlib.Graph({ multigraph: true });
  graph.setGraph({ rankdir: 'TB', nodesep: 34, ranksep: 84, marginx: 12, marginy: 12 });
  graph.setDefaultEdgeLabel(() => ({}));

  for (const table of skeleton.tables) {
    graph.setNode(table.name, { width: nodeWidth(table.name), height: NODE_HEIGHT });
  }

  // 指回自己的关系不画线（自己连自己的线在图上是一团），改成名字后面的 ↻。
  const selfLoops = new Set(
    skeleton.relations.filter((relation) => relation.from === relation.to).map((relation) => relation.from),
  );

  const edges: Edge[] = [];
  skeleton.relations.forEach((relation, index) => {
    if (!graph.hasNode(relation.from) || !graph.hasNode(relation.to)) return;
    if (relation.from === relation.to) return;
    const id = `${relation.from}->${relation.to}#${index}`;
    graph.setEdge(relation.from, relation.to, {}, id);
    edges.push({
      id,
      source: relation.from,
      target: relation.to,
      label: labelOf(relation.cardinality),
      type: 'smoothstep',
      style: { stroke: 'var(--muted-foreground)', strokeWidth: 1.1, strokeOpacity: 0.55 },
      labelStyle: { fill: 'var(--muted-foreground)', fontSize: 10.5, fontVariantNumeric: 'tabular-nums' },
      labelBgStyle: { fill: 'var(--card)', fillOpacity: 1 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 3,
    });
  });

  dagre.layout(graph);

  const nodes: Node[] = skeleton.tables.map((table) => {
    const placed = graph.node(table.name) as { x: number; y: number; width: number; height: number };
    return {
      id: table.name,
      position: { x: placed.x - placed.width / 2, y: placed.y - placed.height / 2 },
      data: { label: selfLoops.has(table.name) ? `${table.name} ↻` : table.name },
      width: placed.width,
      height: placed.height,
      draggable: false,
      style: {
        width: placed.width,
        height: placed.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: 'var(--card)',
        color: 'var(--foreground)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 12,
        whiteSpace: 'nowrap',
      },
    };
  });

  const box = graph.graph() as { width?: number; height?: number };
  return { nodes, edges, height: box.height ?? 0 };
}
