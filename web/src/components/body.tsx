import { closedContour, pinPoint, type Point } from '../body-geometry';
import type { PartView, PinView, TileView } from '../api';

const WIDTH = 960;
const HEIGHT = 620;
const CX = WIDTH / 2;
const CY = 300;

const BOX = { w: 116, h: 30, font: 11, maxChars: 10 };
const TILE = { w: 92, h: 30, gap: 10, cols: 2, rows: 3, font: 11, maxChars: 8, max: 6 };
const LABEL = { font: 11, maxChars: 10, lineH: 14, maxLines: 3 };

function lerp(point: Point, origin: Point, t: number): Point {
  return { x: point.x + (origin.x - point.x) * t, y: point.y + (origin.y - point.y) * t };
}

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

/** 中文按字断行；末行只剩一个字时并回上一行，标签不孤字成行。 */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const all: string[] = [];
  for (let index = 0; index < text.length; index += maxChars) all.push(text.slice(index, index + maxChars));
  const kept = all.slice(0, maxLines);
  if (all.length > maxLines) kept[maxLines - 1] = clip(`${kept[maxLines - 1]}…`, maxChars + 1);
  if (kept.length > 1 && kept[kept.length - 1].length < 2) kept[kept.length - 2] += kept.pop();
  return kept;
}

const PIN_LABEL: Record<PinView['kind'], string> = {
  why: '为什么',
  being: '要成为',
  never: '绝不',
  who: '给谁',
};

/**
 * 三层同框，半径由数据算出来，互不侵占：
 * 血肉格子决定内圈，骨架环套在它外面，灵魂轮廓再套一层，标签留在轮廓外的留白里。
 */
export function Body({
  pins,
  parts,
  tiles,
  selectedPinId,
  onSelectPin,
}: {
  pins: PinView[];
  parts: PartView[];
  tiles: TileView[];
  selectedPinId?: string | null;
  onSelectPin?: (id: string) => void;
}) {
  const alive = tiles.filter((tile) => tile.state !== 'shed').slice(0, TILE.max);
  const shed = tiles.filter((tile) => tile.state === 'shed').slice(0, 3);

  const gridWidth = TILE.cols * TILE.w + (TILE.cols - 1) * TILE.gap;
  const gridHeight = TILE.rows * TILE.h + (TILE.rows - 1) * TILE.gap;

  const ringX = gridWidth / 2 + 72 + BOX.w / 2;
  const ringY = gridHeight / 2 + 54 + BOX.h / 2;
  const bodyX = ringX + BOX.w / 2 + 56;
  const bodyY = ringY + BOX.h / 2 + 44;

  const center = { x: CX, y: CY };
  const anchors = pins.map((pin) => ({ pin, point: pinPoint(pin.angle, pin.reach, CX, CY, bodyX, bodyY) }));
  const contour = closedContour(anchors.map((anchor) => anchor.point));

  const gridX = CX - gridWidth / 2;
  const gridY = CY - gridHeight / 2;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label="灵魂轮廓、骨架与血肉">
        {contour ? (
          <path d={contour} fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="8 7" strokeLinecap="round" opacity="0.42" />
        ) : (
          <ellipse cx={CX} cy={CY} rx={bodyX} ry={bodyY} fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="8 7" opacity="0.16" />
        )}

        {/* 骨架连线先画，盒子后画，线就不会从盒子里穿过去 */}
        {parts.map((part, index) => {
          const from = ringPoint(index, parts.length, ringX, ringY);
          const to = ringPoint((index + 1) % parts.length, parts.length, ringX, ringY);
          return <line key={`link-${part.id}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="currentColor" strokeWidth="2.4" opacity="0.45" />;
        })}

        {parts.map((part, index) => {
          const point = ringPoint(index, parts.length, ringX, ringY);
          return (
            <g key={part.id}>
              <rect x={point.x - BOX.w / 2} y={point.y - BOX.h / 2} width={BOX.w} height={BOX.h} rx="7" fill="var(--background)" stroke="currentColor" strokeWidth="2.4" />
              <text x={point.x} y={point.y} textAnchor="middle" dominantBaseline="middle" fontSize={BOX.font} fill="currentColor">
                {clip(part.name, BOX.maxChars)}
              </text>
            </g>
          );
        })}

        {alive.map((tile, index) => {
          const column = index % TILE.cols;
          const row = Math.floor(index / TILE.cols);
          const x = gridX + column * (TILE.w + TILE.gap);
          const y = gridY + row * (TILE.h + TILE.gap);
          return (
            <g key={tile.id} opacity={tile.state === 'pending' ? 0.45 : 0.85}>
              <rect x={x} y={y} width={TILE.w} height={TILE.h} rx="6" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray={tile.state === 'pending' ? '3 3' : undefined} />
              <text x={x + TILE.w / 2} y={y + TILE.h / 2} textAnchor="middle" dominantBaseline="middle" fontSize={TILE.font} fill="currentColor">
                {clip(tile.name, TILE.maxChars)}
              </text>
            </g>
          );
        })}

        {/* 钉子：钉头在轮廓上，钉身朝里，标签挂在轮廓外并自动换行 */}
        {anchors.map(({ pin, point }) => {
          const inward = lerp(point, center, 0.06);
          const head = lerp(point, center, -0.012);
          const raw = lerp(point, center, -0.11);
          const atStart = raw.x >= CX;
          const room = LABEL.maxChars * LABEL.font;
          const labelX = atStart ? Math.min(raw.x, WIDTH - room - 4) : Math.max(raw.x, room + 4);
          const lines = wrap(pin.statement, LABEL.maxChars, LABEL.maxLines);
          const blockTop = Math.min(Math.max(raw.y - ((lines.length - 1) * LABEL.lineH) / 2, LABEL.lineH), HEIGHT - LABEL.lineH * lines.length);
          const active = selectedPinId === pin.id;
          return (
            <g key={pin.id} className="cursor-pointer" onClick={() => onSelectPin?.(pin.id)} opacity={active ? 1 : 0.78}>
              <line x1={head.x} y1={head.y} x2={inward.x} y2={inward.y} stroke="currentColor" strokeWidth={active ? 3 : 2} strokeLinecap="round" />
              <circle cx={head.x} cy={head.y} r={active ? 4.6 : 3.6} fill="currentColor" />
              <text x={labelX} y={blockTop} textAnchor={atStart ? 'start' : 'end'} dominantBaseline="middle" fontSize={LABEL.font} fill="currentColor" opacity={active ? 1 : 0.62}>
                {lines.map((line, index) => (
                  <tspan key={line + index} x={labelX} dy={index === 0 ? 0 : LABEL.lineH}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}

        {/* 脱落的血肉：飘在轮廓下面，带一小段虚线尾巴 */}
        {shed.map((tile, index) => {
          const x = CX - 150 + index * 150;
          const y = HEIGHT - 34;
          return (
            <g key={tile.id} opacity="0.4">
              <line x1={x - 26} y1={y - 30} x2={x - 24} y2={y - 14} stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
              <rect x={x - 44} y={y - 13} width="88" height="26" rx="5" fill="var(--background)" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="currentColor">
                {clip(tile.name, 7)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ringPoint(index: number, total: number, rx: number, ry: number): Point {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / Math.max(total, 1);
  return { x: CX + Math.cos(angle) * rx, y: CY + Math.sin(angle) * ry };
}

export { PIN_LABEL };
