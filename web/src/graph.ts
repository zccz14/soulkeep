import type { Cardinality, Skeleton } from './api';

/**
 * 概念 ER 图的排版：实体分层排开，关系用菱形摆在两层中间。
 * 位置只由这份骨架决定——同一份骨架每次画出来都一样。
 */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GraphNode extends Box {
  name: string;
}

export interface GraphEdge extends Box {
  from: string;
  to: string;
  cardinality: Cardinality;
}

export interface GraphLayout {
  width: number;
  height: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const DIAMOND = { width: 46, height: 32 };

const NODE_HEIGHT = 28;
const ROW_GAP = 134;
const COLUMN_GAP = 44;
/** 一层太宽就折行：宁可多一层，也别把字挤成蚂蚁。 */
const MAX_ROW_WIDTH = 820;
const PADDING = 30;

export function nodeWidth(name: string): number {
  return Math.max(56, name.length * 7.4 + 20);
}

export function layoutSkeleton(skeleton: Skeleton): GraphLayout {
  const nodes: GraphNode[] = skeleton.tables.map((table) => ({
    name: table.name,
    width: nodeWidth(table.name),
    height: NODE_HEIGHT,
    x: 0,
    y: 0,
  }));
  const at = new Map(nodes.map((node) => [node.name, node]));

  const edges: GraphEdge[] = skeleton.relations
    .filter((relation) => at.has(relation.from) && at.has(relation.to))
    .map((relation) => ({
      from: relation.from,
      to: relation.to,
      cardinality: relation.cardinality,
      x: 0,
      y: 0,
      width: DIAMOND.width,
      height: DIAMOND.height,
    }));

  const ranks = rank(nodes, edges);
  arrange(nodes, edges, ranks);
  placeEdges(edges, at);

  return { ...fit(nodes, edges), nodes, edges };
}

/** 关系的方向就是层次的方向：先找没有入边的，再一路往下排。 */
function rank(nodes: GraphNode[], edges: GraphEdge[]): Map<string, number> {
  const outgoing = new Map<string, string[]>(nodes.map((node) => [node.name, []]));
  const indegree = new Map<string, number>(nodes.map((node) => [node.name, 0]));
  const links = edges.filter((edge) => edge.from !== edge.to);

  // 环会让「没有入边」的点消失，先按深度优先把回边挑出来，剩下的就是 DAG。
  const back = new Set<GraphEdge>();
  const state = new Map<string, 'new' | 'open' | 'done'>(nodes.map((node) => [node.name, 'new']));
  const walk = (name: string) => {
    state.set(name, 'open');
    for (const edge of links.filter((item) => item.from === name)) {
      const next = state.get(edge.to);
      if (next === 'open') back.add(edge);
      else if (next === 'new') walk(edge.to);
    }
    state.set(name, 'done');
  };
  for (const node of nodes) if (state.get(node.name) === 'new') walk(node.name);

  for (const edge of links) {
    if (back.has(edge)) continue;
    outgoing.get(edge.from)!.push(edge.to);
    indegree.set(edge.to, indegree.get(edge.to)! + 1);
  }

  const depth = new Map<string, number>(nodes.map((node) => [node.name, 0]));
  const ready = nodes.filter((node) => indegree.get(node.name) === 0).map((node) => node.name);
  while (ready.length > 0) {
    const name = ready.shift()!;
    for (const next of outgoing.get(name)!) {
      depth.set(next, Math.max(depth.get(next)!, depth.get(name)! + 1));
      indegree.set(next, indegree.get(next)! - 1);
      if (indegree.get(next) === 0) ready.push(next);
    }
  }
  return depth;
}

/** 每一层一条横线；层内按「从哪来」的平均位置排，少交叉。 */
function arrange(nodes: GraphNode[], edges: GraphEdge[], ranks: Map<string, number>): void {
  const rows = new Map<number, GraphNode[]>();
  for (const node of nodes) {
    const level = ranks.get(node.name) ?? 0;
    rows.set(level, [...(rows.get(level) ?? []), node]);
  }

  const order = [...rows.keys()].sort((a, b) => a - b);
  let y = PADDING + NODE_HEIGHT / 2;
  for (const level of order) {
    const row = rows.get(level)!;
    row.sort((a, b) => {
      const left = parentBias(a.name, edges, nodes);
      const right = parentBias(b.name, edges, nodes);
      return left === right ? a.name.localeCompare(b.name) : left - right;
    });

    for (const line of pack(row)) {
      let cursor = PADDING;
      for (const node of line) {
        node.x = cursor + node.width / 2;
        node.y = y;
        cursor += node.width + COLUMN_GAP;
      }
      y += NODE_HEIGHT + ROW_GAP - 34;
    }
    y += 34;
  }
}

function pack(row: GraphNode[]): GraphNode[][] {
  const lines: GraphNode[][] = [];
  let line: GraphNode[] = [];
  for (const node of row) {
    const grown = line.length === 0 ? node.width : totalWidth(line) + COLUMN_GAP + node.width;
    if (line.length > 0 && grown > MAX_ROW_WIDTH) {
      lines.push(line);
      line = [node];
      continue;
    }
    line.push(node);
  }
  if (line.length > 0) lines.push(line);
  return lines;
}

function totalWidth(row: GraphNode[]): number {
  return row.reduce((sum, node) => sum + node.width, 0) + COLUMN_GAP * Math.max(0, row.length - 1);
}

function parentBias(name: string, edges: GraphEdge[], nodes: GraphNode[]): number {
  const parents = edges.filter((edge) => edge.to === name && edge.from !== name).map((edge) => edge.from);
  if (parents.length === 0) return Number.MAX_SAFE_INTEGER;
  return parents.reduce((sum, parent) => sum + (nodes.find((node) => node.name === parent)?.x ?? 0), 0) / parents.length;
}

/** 菱形摆在两个实体的正中间；撞上别的实体就沿垂直方向让开。 */
function placeEdges(edges: GraphEdge[], at: Map<string, GraphNode>): void {
  const placed: GraphEdge[] = [];
  for (const edge of edges) {
    const from = at.get(edge.from)!;
    const to = at.get(edge.to)!;

    if (from === to) {
      edge.x = from.x;
      edge.y = from.y - from.height / 2 - DIAMOND.height / 2 - 30;
      placed.push(edge);
      continue;
    }

    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const across = { x: -(to.y - from.y), y: to.x - from.x };
    const length = Math.hypot(across.x, across.y) || 1;
    const side = { x: across.x / length, y: across.y / length };

    for (const offset of [0, 34, -34, 62, -62, 92, -92]) {
      const x = midX + side.x * offset;
      const y = midY + side.y * offset;
      edge.x = x;
      edge.y = y;
      if (isFree(x, y, placed, at, from, to)) break;
    }
    placed.push(edge);
  }
}

function isFree(x: number, y: number, placed: GraphEdge[], at: Map<string, GraphNode>, from: GraphNode, to: GraphNode): boolean {
  for (const node of at.values()) {
    if (node === from || node === to) continue;
    if (Math.abs(x - node.x) < node.width / 2 + DIAMOND.width / 2 + 8 && Math.abs(y - node.y) < node.height / 2 + DIAMOND.height / 2 + 8) {
      return false;
    }
  }
  for (const edge of placed) {
    if (Math.hypot(x - edge.x, y - edge.y) < DIAMOND.width + 6) return false;
  }
  return true;
}

function fit(nodes: GraphNode[], edges: GraphEdge[]): { width: number; height: number } {
  if (nodes.length === 0) return { width: 0, height: 0 };

  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const box of [...nodes, ...edges]) {
    left = Math.min(left, box.x - box.width / 2);
    right = Math.max(right, box.x + box.width / 2);
    top = Math.min(top, box.y - box.height / 2);
    bottom = Math.max(bottom, box.y + box.height / 2);
  }

  const dx = PADDING - left;
  const dy = PADDING - top;
  for (const box of [...nodes, ...edges]) {
    box.x += dx;
    box.y += dy;
  }

  return { width: Math.ceil(right - left + PADDING * 2), height: Math.ceil(bottom - top + PADDING * 2) };
}

/** 线不进到节点里面：从中心往对方走，撞到边框就停。 */
export function boundaryPoint(node: Box, towardX: number, towardY: number): { x: number; y: number } {
  const dx = towardX - node.x;
  const dy = towardY - node.y;
  const halfWidth = node.width / 2 + 2;
  const halfHeight = node.height / 2 + 2;
  const scale = Math.min(dx === 0 ? Infinity : halfWidth / Math.abs(dx), dy === 0 ? Infinity : halfHeight / Math.abs(dy));
  return { x: node.x + dx * scale, y: node.y + dy * scale };
}
