export interface Point {
  x: number;
  y: number;
}

/**
 * 钉子落在轮廓上的位置。
 * 半径带一点周期扰动：同样的钉子永远得到同一条轮廓，而轮廓不会像标准椭圆那样机械。
 */
export function pinPoint(angle: number, reach: number, cx: number, cy: number, rx: number, ry: number): Point {
  const rad = (angle * Math.PI) / 180;
  const wobble = 1 + 0.055 * Math.sin(rad * 3 + 0.7) + 0.03 * Math.cos(rad * 2 - 0.4);
  return {
    x: cx + Math.cos(rad) * rx * reach * wobble,
    y: cy + Math.sin(rad) * ry * reach * wobble,
  };
}

function fmt(value: number): string {
  return (Math.round(value * 100) / 100).toString();
}

/** 闭口平滑曲线：Catmull-Rom 转三次贝塞尔。轮廓从钉子上穿过，钉子一动，形状就变。 */
export function closedContour(points: Point[]): string {
  if (points.length < 3) return '';
  const total = points.length;
  const at = (index: number) => points[((index % total) + total) % total];
  let path = `M ${fmt(points[0].x)} ${fmt(points[0].y)}`;
  for (let i = 0; i < total; i += 1) {
    const previous = at(i - 1);
    const start = at(i);
    const end = at(i + 1);
    const next = at(i + 2);
    const c1 = { x: start.x + (end.x - previous.x) / 6, y: start.y + (end.y - previous.y) / 6 };
    const c2 = { x: end.x - (next.x - start.x) / 6, y: end.y - (next.y - start.y) / 6 };
    path += ` C ${fmt(c1.x)} ${fmt(c1.y)}, ${fmt(c2.x)} ${fmt(c2.y)}, ${fmt(end.x)} ${fmt(end.y)}`;
  }
  return `${path} Z`;
}
