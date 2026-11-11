import { useMemo } from 'react';
import type { Cardinality, Skeleton } from '../api';
import { DIAMOND, boundaryPoint, layoutSkeleton, type Box, type GraphEdge, type GraphNode } from '../graph';

const LINE = 'var(--muted-foreground)';
const DIAMOND_SHAPE = { width: DIAMOND.width, height: DIAMOND.height };

/**
 * 概念 ER 图：方框是实体（表），菱形是关系本身，两端标「1」与「N」。
 * 不画字段——字段属于血肉。
 */
export function SkeletonGraph({ skeleton }: { skeleton: Skeleton }) {
  const layout = useMemo(() => layoutSkeleton(skeleton), [skeleton]);
  const at = useMemo(() => new Map(layout.nodes.map((node) => [node.name, node])), [layout.nodes]);

  if (layout.nodes.length === 0) return null;

  return (
    <figure className="flex flex-col gap-2 border-t border-border pt-3">
      <svg
        aria-label="概念 ER 图：实体与它们之间的关系"
        className="w-full"
        role="img"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
      >
        {layout.edges.map((edge, index) => (
          <Relation key={`${edge.from}-${edge.to}-${index}`} at={at} edge={edge} />
        ))}
        {layout.nodes.map((node) => (
          <g key={node.name}>
            <rect
              fill="var(--card)"
              height={node.height}
              rx={6}
              stroke="var(--border)"
              width={node.width}
              x={node.x - node.width / 2}
              y={node.y - node.height / 2}
            />
            <text
              className="font-mono"
              dominantBaseline="central"
              fill="var(--foreground)"
              fontSize={11.5}
              textAnchor="middle"
              x={node.x}
              y={node.y + 0.5}
            >
              {node.name}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="text-xs text-muted-foreground">
        方框是实体，菱形是关系本身；两端标着「1」与「N」：一头一个，一头多个。
      </figcaption>
    </figure>
  );
}

function Relation({ edge, at }: { edge: GraphEdge; at: Map<string, GraphNode> }) {
  const from = at.get(edge.from);
  const to = at.get(edge.to);
  if (!from || !to) return null;

  const legs = from === to ? selfLegs(from, edge) : pairLegs(from, to, edge);

  return (
    <g>
      {legs.map((leg, index) => (
        <g key={index}>
          <line
            stroke={LINE}
            strokeOpacity={0.5}
            strokeWidth={1.2}
            x1={leg.start.x}
            x2={leg.end.x}
            y1={leg.start.y}
            y2={leg.end.y}
          />
          <text
            dominantBaseline="central"
            fill="var(--muted-foreground)"
            fontSize={10.5}
            paintOrder="stroke"
            stroke="var(--card)"
            strokeWidth={3}
            textAnchor="middle"
            x={leg.label.x}
            y={leg.label.y}
          >
            {leg.text}
          </text>
        </g>
      ))}
      <polygon
        fill="var(--card)"
        points={`${edge.x},${edge.y - DIAMOND.height / 2} ${edge.x + DIAMOND.width / 2},${edge.y} ${edge.x},${edge.y + DIAMOND.height / 2} ${edge.x - DIAMOND.width / 2},${edge.y}`}
        stroke="var(--border)"
        strokeWidth={1.2}
      />
    </g>
  );
}

interface Leg {
  start: { x: number; y: number };
  end: { x: number; y: number };
  label: { x: number; y: number };
  text: string;
}

function pairLegs(from: GraphNode, to: GraphNode, edge: GraphEdge): Leg[] {
  const diamond: Box = { x: edge.x, y: edge.y, width: DIAMOND.width, height: DIAMOND.height };
  return [
    leg(from, diamond, cardinalityText(edge.cardinality, 'from')),
    leg(to, diamond, cardinalityText(edge.cardinality, 'to')),
  ];
}

/** 自指的两个箭头都落在同一个实体上：菱形在它头顶，两边各牵一条线。 */
function selfLegs(node: GraphNode, edge: GraphEdge): Leg[] {
  const diamond: Box = { x: edge.x, y: edge.y, width: DIAMOND.width, height: DIAMOND.height };
  const foot = { x: diamond.x, y: diamond.y + diamond.height / 2 };
  const spread = Math.min(52, node.width / 2 - 8);
  return [
    leg(node, diamond, cardinalityText(edge.cardinality, 'from'), { x: foot.x - spread * 0.7, y: foot.y }, -1),
    leg(node, diamond, cardinalityText(edge.cardinality, 'to'), { x: foot.x + spread * 0.7, y: foot.y }, 1),
  ];
}

/** 一条腿：实体边上出发，菱形边上收住；数字摆在腿的中间偏一侧。 */
function leg(from: Box, diamond: Box, text: string, toward: { x: number; y: number } = diamond, push = 0): Leg {
  const start = boundaryPoint(from, toward.x, toward.y);
  const end = boundaryPoint(diamond, from.x, from.y);
  const across = { x: -(end.y - start.y), y: end.x - start.x };
  const length = Math.hypot(across.x, across.y) || 1;
  const offset = push === 0 ? 10 : push * 12;
  return {
    start,
    end,
    text,
    label: {
      x: (start.x + end.x) / 2 + (across.x / length) * offset,
      y: (start.y + end.y) / 2 + (across.y / length) * offset,
    },
  };
}

function cardinalityText(cardinality: Cardinality, side: 'from' | 'to'): string {
  if (cardinality === 'one-to-one') return '1';
  if (cardinality === 'many-to-many') return side === 'from' ? 'N' : 'M';
  return side === 'from' ? '1' : 'N';
}
