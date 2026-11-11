import { describe, expect, it } from 'vitest';
import { endpointLabels, layoutSkeleton } from '../web/src/graph';

function skeleton(tables: string[], relations: Array<[string, string, 'one-to-one' | 'one-to-many' | 'many-to-many']>) {
  return {
    version: 1 as const,
    tables: tables.map((name) => ({ name, note: '' })),
    relations: relations.map(([from, to, cardinality]) => ({ from, to, cardinality })),
  };
}

describe('骨架关系图', () => {
  it('两头的基数都对得上', () => {
    expect(endpointLabels('one-to-one')).toEqual({ start: '1', end: '1' });
    expect(endpointLabels('one-to-many')).toEqual({ start: '1', end: 'N' });
    expect(endpointLabels('many-to-many')).toEqual({ start: 'N', end: 'M' });
  });

  it('每个实体一个方框，关系两头都在才画线', () => {
    const diagram = layoutSkeleton(
      skeleton(['projects', 'runs'], [['projects', 'runs', 'one-to-many']]),
    );
    expect(diagram.nodes.map((node) => node.id)).toEqual(['projects', 'runs']);
    expect(diagram.edges).toHaveLength(1);
    expect(diagram.edges[0].data).toMatchObject({ start: '1', end: 'N' });
  });

  it('指着不存在实体的关系会被跳过，不会画出一条断线', () => {
    const diagram = layoutSkeleton(skeleton(['projects'], [['projects', 'ghost', 'one-to-many']]));
    expect(diagram.edges).toHaveLength(0);
  });

  it('同一对实体上两条关系不互相覆盖', () => {
    const diagram = layoutSkeleton(
      skeleton(['a', 'b'], [['a', 'b', 'one-to-many'], ['a', 'b', 'many-to-many']]),
    );
    expect(new Set(diagram.edges.map((edge) => edge.id)).size).toBe(2);
  });

  it('空骨架不画任何东西', () => {
    expect(layoutSkeleton(skeleton([], [])).nodes).toEqual([]);
  });

  it('位置稳定：同一份骨架排两次一模一样', () => {
    const input = skeleton(['a', 'b', 'c'], [['a', 'b', 'one-to-many'], ['b', 'c', 'one-to-one']]);
    expect(layoutSkeleton(input).nodes.map((node) => node.position)).toEqual(
      layoutSkeleton(input).nodes.map((node) => node.position),
    );
  });
});
