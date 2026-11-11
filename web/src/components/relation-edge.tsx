import { BaseEdge, Position, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import type { RelationData } from '../graph';

/**
 * 关系的连线：两头各贴一个基数标签（1 / N / M），箭头指出方向。
 * 标签贴着各自的实体，不放在线的中间——线拐弯或几条线挨着时，中间的字认不出是谁的。
 */
export function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps) {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 10,
    offset: 20,
  });

  const labels = data as RelationData | undefined;
  const start = labelPoint(sourceX, sourceY, sourcePosition);
  const end = labelPoint(targetX, targetY, targetPosition);
  const dim = labels?.dim === true;

  return (
    <>
      <BaseEdge id={id} markerEnd={markerEnd} path={path} style={style} />
      {labels ? (
        <>
          <Cardinality x={start.x} y={start.y} text={labels.start} dim={dim} />
          <Cardinality x={end.x} y={end.y} text={labels.end} dim={dim} />
        </>
      ) : null}
    </>
  );
}

function Cardinality({ x, y, text, dim }: { x: number; y: number; text: string; dim: boolean }) {
  return (
    <text
      dominantBaseline="central"
      fill="var(--muted-foreground)"
      fontSize={10.5}
      opacity={dim ? 0.25 : 1}
      paintOrder="stroke"
      stroke="var(--background)"
      strokeWidth={3}
      style={{ fontVariantNumeric: 'tabular-nums', pointerEvents: 'none' }}
      textAnchor="middle"
      x={x}
      y={y}
    >
      {text}
    </text>
  );
}

/** 从端点往外挪一点，再往旁边让一点，别压在方框和线上。 */
function labelPoint(x: number, y: number, position: Position): { x: number; y: number } {
  const out =
    position === Position.Top
      ? { x: 0, y: -1 }
      : position === Position.Bottom
        ? { x: 0, y: 1 }
        : position === Position.Left
          ? { x: -1, y: 0 }
          : { x: 1, y: 0 };
  const along = 16;
  const aside = 9;
  return { x: x + out.x * along - out.y * aside, y: y + out.y * along + out.x * aside };
}
