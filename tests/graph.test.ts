import { describe, expect, it } from 'vitest';
import { layoutSkeleton, relationKind } from '../web/src/graph';

type Card = 'one-to-one' | 'one-to-many' | 'many-to-many';

function skeleton(tables: string[], relations: Array<[string, string, Card]>) {
  return {
    version: 1 as const,
    tables: tables.map((name) => ({ name, note: '' })),
    relations: relations.map(([from, to, cardinality]) => ({ from, to, cardinality })),
  };
}

function y(diagram: ReturnType<typeof layoutSkeleton>, name: string) {
  return diagram.nodes.find((node) => node.id === name)!.position.y;
}

describe('骨架关系图', () => {
  it('三种基数各自对应一种关系性质', () => {
    expect(relationKind('one-to-many')).toBe('owns');
    expect(relationKind('many-to-many')).toBe('peer');
    expect(relationKind('one-to-one')).toBe('same');
  });

  it('一对多把「一」排在上面，「多」排在下面', () => {
    const diagram = layoutSkeleton(skeleton(['projects', 'runs'], [['projects', 'runs', 'one-to-many']]));
    expect(y(diagram, 'projects')).toBeLessThan(y(diagram, 'runs'));
  });

  it('只有从属画箭头，平级与同体画线不画箭头', () => {
    const owns = layoutSkeleton(skeleton(['a', 'b'], [['a', 'b', 'one-to-many']]));
    const peer = layoutSkeleton(skeleton(['a', 'b'], [['a', 'b', 'many-to-many']]));
    const same = layoutSkeleton(skeleton(['a', 'b'], [['a', 'b', 'one-to-one']]));
    expect(owns.edges[0].markerEnd).toBeTruthy();
    expect(peer.edges[0].markerEnd).toBeUndefined();
    expect(same.edges[0].markerEnd).toBeUndefined();
  });

  it('平级的两方站在同一层，谁也不在谁上面', () => {
    const diagram = layoutSkeleton(skeleton(['threads', 'manuals'], [['threads', 'manuals', 'many-to-many']]));
    expect(y(diagram, 'threads')).toBe(y(diagram, 'manuals'));
  });

  it('同一个东西的两半也站在同一层', () => {
    const diagram = layoutSkeleton(skeleton(['addresses', 'keys'], [['addresses', 'keys', 'one-to-one']]));
    expect(y(diagram, 'addresses')).toBe(y(diagram, 'keys'));
  });

  it('挂着别人的实体填深色，只挂在别人身上的填浅色', () => {
    const diagram = layoutSkeleton(
      skeleton(['projects', 'runs', 'events'], [['projects', 'runs', 'one-to-many'], ['runs', 'events', 'one-to-many']]),
    );
    const style = (name: string) => diagram.nodes.find((node) => node.id === name)!.style!;
    expect(style('projects').background).toBe('var(--foreground)');
    expect(style('runs').background).toBe('var(--foreground)');
    expect(style('events').background).toBe('var(--card)');
  });

  it('每条线都不写字，基数不再堆在图中间', () => {
    const diagram = layoutSkeleton(skeleton(['a', 'b'], [['a', 'b', 'one-to-many']]));
    expect(diagram.edges[0].label).toBeUndefined();
  });

  it('指着不存在实体的关系会被跳过，不会画出一条断线', () => {
    const diagram = layoutSkeleton(skeleton(['projects'], [['projects', 'ghost', 'one-to-many']]));
    expect(diagram.edges).toHaveLength(0);
  });

  it('指着自己的关系不画线，只在名字后面标 ↻', () => {
    const diagram = layoutSkeleton(skeleton(['documents'], [['documents', 'documents', 'one-to-many']]));
    expect(diagram.edges).toHaveLength(0);
    expect(diagram.nodes[0].data).toEqual({ label: 'documents ↻' });
  });

  it('同一对实体上两条关系不互相覆盖', () => {
    const diagram = layoutSkeleton(
      skeleton(['a', 'b'], [['a', 'b', 'one-to-many'], ['a', 'b', 'many-to-many']]),
    );
    expect(new Set(diagram.edges.map((edge) => edge.id)).size).toBe(2);
  });

  it('一条关系都没有的实体单独列出来，不混进层级', () => {
    const diagram = layoutSkeleton(
      skeleton(['projects', 'runs', 'orphan'], [['projects', 'runs', 'one-to-many']]),
    );
    expect(diagram.isolated).toEqual(['orphan']);
    expect(diagram.nodes.map((node) => node.id)).toEqual(['projects', 'runs']);
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
