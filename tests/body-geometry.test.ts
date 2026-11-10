import { describe, expect, it } from 'vitest';
import { closedContour, pinPoint } from '../web/src/body-geometry';

describe('pinPoint', () => {
  it('同一组参数永远得到同一个落点', () => {
    expect(pinPoint(37, 1, 100, 80, 60, 40)).toEqual(pinPoint(37, 1, 100, 80, 60, 40));
  });

  it('撑得越远，离中心越远', () => {
    const near = pinPoint(0, 0.8, 0, 0, 100, 100);
    const far = pinPoint(0, 1.2, 0, 0, 100, 100);
    expect(far.x).toBeGreaterThan(near.x);
  });
});

describe('closedContour', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];

  it('三个点以下画不出轮廓', () => {
    expect(closedContour(points.slice(0, 2))).toBe('');
  });

  it('每个点一段曲线，并且首尾闭合', () => {
    const path = closedContour(points);
    expect(path.startsWith('M ')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
    expect(path.match(/ C /g)).toHaveLength(points.length);
  });
});
