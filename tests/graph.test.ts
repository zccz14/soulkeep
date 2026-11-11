import { describe, expect, it } from 'vitest';
import { layoutSkeleton } from '../web/src/graph';

function skeleton(tables: string[], relations: Array<[string, string, 'one-to-one' | 'one-to-many' | 'many-to-many']>) {
  return {
    version: 1 as const,
    tables: tables.map((name) => ({ name, note: '' })),
    relations: relations.map(([from, to, cardinality]) => ({ from, to, cardinality })),
  };
}

describe('layoutSkeleton', () => {
  it('同一份骨架画两次，位置一模一样', () => {
    const input = skeleton(['projects', 'runs', 'snapshots'], [
      ['projects', 'runs', 'one-to-many'],
      ['projects', 'snapshots', 'one-to-many'],
      ['snapshots', 'runs', 'one-to-many'],
    ]);
    expect(layoutSkeleton(input)).toEqual(layoutSkeleton(input));
  });

  it('每个实体和每个菱形都落在画布里', () => {
    const layout = layoutSkeleton(
      skeleton(['a', 'b', 'c'], [
        ['a', 'b', 'one-to-many'],
        ['b', 'c', 'many-to-many'],
        ['a', 'c', 'one-to-one'],
      ]),
    );
    for (const box of [...layout.nodes, ...layout.edges]) {
      expect(box.x - box.width / 2).toBeGreaterThanOrEqual(0);
      expect(box.y - box.height / 2).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width / 2).toBeLessThanOrEqual(layout.width);
      expect(box.y + box.height / 2).toBeLessThanOrEqual(layout.height);
    }
  });

  it('自指的关系也有自己的菱形，摆在实体头上', () => {
    const layout = layoutSkeleton(skeleton(['manuals'], [['manuals', 'manuals', 'one-to-many']]));
    expect(layout.edges).toHaveLength(1);
    expect(layout.edges[0].y).toBeLessThan(layout.nodes[0].y);
  });

  it('空骨架不画任何东西', () => {
    expect(layoutSkeleton(skeleton([], []))).toEqual({ width: 0, height: 0, nodes: [], edges: [] });
  });

  it('环不会把排版卡死：三层互相指也能排出来', () => {
    const layout = layoutSkeleton(
      skeleton(['a', 'b', 'c'], [
        ['a', 'b', 'one-to-many'],
        ['b', 'c', 'one-to-many'],
        ['c', 'a', 'one-to-many'],
      ]),
    );
    expect(layout.nodes.map((node) => Number.isFinite(node.y))).toEqual([true, true, true]);
    expect(layout.width).toBeGreaterThan(0);
  });
});
