import dagre from '@dagrejs/dagre';
import type { CSSProperties } from 'react';
import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { Cardinality, Skeleton } from './api';

/**
 * 骨架画成一张有层次的图：竖轴是「谁在谁之上」。
 * 一对多的方向就是从属的方向——上面挂着下面；多对多（平级）与一对一（同体）
 * 不分上下，先并成一组、站在同一层，再靠线型区别。所以层的深浅就是核心与边缘。
 */
export interface Diagram {
  nodes: Node[];
  edges: Edge[];
  height: number;
  /** 一条关系都没有的实体：它们不在层级里，单独列出来，别混进图里当核心。 */
  isolated: string[];
}

export type RelationKind = 'owns' | 'peer' | 'same';

const CORE_HEIGHT = 36;
const LEAF_HEIGHT = 32;
const MEMBER_GAP = 26;

export function relationKind(cardinality: Cardinality): RelationKind {
  if (cardinality === 'one-to-many') return 'owns';
  if (cardinality === 'many-to-many') return 'peer';
  return 'same';
}

export function nodeWidth(name: string): number {
  // 12px 等宽字体大约每个字 7.3px，再留出两侧内边距；宁可宽一点，也别让名字顶出方框。
  return Math.max(96, name.length * 7.4 + 30);
}

const EDGE_STYLE: Record<RelationKind, CSSProperties> = {
  owns: { strokeWidth: 1.2, strokeOpacity: 0.55 },
  peer: { strokeWidth: 1.2, strokeOpacity: 0.5, strokeDasharray: '5 4' },
  same: { strokeWidth: 1.1, strokeOpacity: 0.4, strokeDasharray: '1.5 3' },
};

const BOX: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 6,
  whiteSpace: 'nowrap',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12,
};

function boxStyle(core: boolean): CSSProperties {
  if (core) {
    return { ...BOX, background: 'var(--foreground)', color: 'var(--background)', border: '1px solid var(--foreground)', fontWeight: 600 };
  }
  return { ...BOX, background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' };
}

interface Placed {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function layoutSkeleton(skeleton: Skeleton): Diagram {
  const names = skeleton.tables.map((table) => table.name);
  const index = new Map(names.map((name, at) => [name, at]));
  const wired = skeleton.relations.filter((relation) => index.has(relation.from) && index.has(relation.to));
  const known = wired.filter((relation) => relation.from !== relation.to);

  const touched = new Set(wired.flatMap((relation) => [relation.from, relation.to]));
  const isolated = names.filter((name) => !touched.has(name));
  const linked = names.filter((name) => touched.has(name));

  // 一个实体挂着几个下层，决定它有多核心，也决定方框的分量。
  const owned = new Map<string, number>(linked.map((name) => [name, 0]));
  for (const relation of known) {
    if (relationKind(relation.cardinality) === 'owns') {
      owned.set(relation.from, (owned.get(relation.from) ?? 0) + 1);
    }
  }
  const core = (name: string) => (owned.get(name) ?? 0) > 0;
  const heightOf = (name: string) => (core(name) ? CORE_HEIGHT : LEAF_HEIGHT);

  // 平级与同体：并成一组，整组占一块地方，组内并排站。
  const group = new Map<string, string>();
  for (const name of linked) group.set(name, name);
  const rootOf = (name: string): string => {
    const next = group.get(name) ?? name;
    return next === name ? name : rootOf(next);
  };
  for (const relation of known) {
    if (relationKind(relation.cardinality) === 'owns') continue;
    group.set(rootOf(relation.to), rootOf(relation.from));
  }

  const members = new Map<string, string[]>();
  for (const name of linked) {
    const root = rootOf(name);
    members.set(root, [...(members.get(root) ?? []), name]);
  }

  // multigraph：同一对实体之间可以有几条不同的关系，各画各的线。
  const graph = new dagre.graphlib.Graph({ multigraph: true });
  graph.setGraph({ rankdir: 'TB', nodesep: 30, ranksep: 72, marginx: 12, marginy: 12 });
  graph.setDefaultEdgeLabel(() => ({}));

  for (const [root, groupMembers] of members) {
    const boxes = groupMembers.map((name) => ({ width: nodeWidth(name), height: heightOf(name) }));
    graph.setNode(root, {
      width: boxes.reduce((sum, box) => sum + box.width, 0) + MEMBER_GAP * (boxes.length - 1),
      height: Math.max(...boxes.map((box) => box.height)),
    });
  }

  known.forEach((relation, at) => {
    if (relationKind(relation.cardinality) !== 'owns') return;
    const from = rootOf(relation.from);
    const to = rootOf(relation.to);
    if (from === to) return;
    graph.setEdge(from, to, {}, `${from}->${to}#${at}`);
  });

  dagre.layout(graph);

  const nodes: Node[] = [];
  for (const [root, groupMembers] of members) {
    const placed = graph.node(root) as Placed;
    let left = placed.x - placed.width / 2;
    for (const name of groupMembers) {
      const width = nodeWidth(name);
      const height = heightOf(name);
      nodes.push({
        id: name,
        position: { x: left, y: placed.y - height / 2 },
        data: { label: name },
        width,
        height,
        draggable: false,
        style: { ...boxStyle(core(name)), width, height },
      });
      left += width + MEMBER_GAP;
    }
  }

  // 指回自己的关系不画线（自己连自己的线在图上是一团），改成名字后面的 ↻。
  for (const name of new Set(skeleton.relations.filter((r) => r.from === r.to).map((r) => r.from))) {
    const node = nodes.find((item) => item.id === name);
    if (node) node.data = { label: `${name} ↻` };
  }

  const edges: Edge[] = known.map((relation, at) => {
    const kind = relationKind(relation.cardinality);
    return {
      id: `${relation.from}->${relation.to}#${at}`,
      source: relation.from,
      target: relation.to,
      type: 'smoothstep',
      markerEnd:
        kind === 'owns'
          ? { type: MarkerType.ArrowClosed, width: 13, height: 13, color: 'var(--muted-foreground)' }
          : undefined,
      style: { stroke: 'var(--muted-foreground)', ...EDGE_STYLE[kind] },
    };
  });

  const box = graph.graph() as { height?: number };
  return { nodes, edges, height: box.height ?? 0, isolated };
}
