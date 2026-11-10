import { describe, expect, it } from 'vitest';
import { normalizeSkeleton } from '../src/skeleton';

describe('normalizeSkeleton', () => {
  it('只留表名与非空的备注', () => {
    const skeleton = normalizeSkeleton({ version: 1, tables: [{ name: ' products ', note: ' 一个产品 ' }, { name: 'tiles' }] });
    expect(skeleton.tables).toEqual([
      { name: 'products', note: '一个产品' },
      { name: 'tiles', note: '' },
    ]);
  });

  it('关系带着两头与基数', () => {
    const skeleton = normalizeSkeleton({
      version: 1,
      tables: [{ name: 'products' }, { name: 'tiles' }],
      relations: [{ from: 'products', to: 'tiles', cardinality: 'one-to-many' }],
    });
    expect(skeleton.relations).toEqual([{ from: 'products', to: 'tiles', cardinality: 'one-to-many' }]);
  });

  it('老文档没有 relations 时补成空数组', () => {
    expect(normalizeSkeleton({ version: 1, tables: [{ name: 'products' }] }).relations).toEqual([]);
  });

  it('拒掉别的版本', () => {
    expect(() => normalizeSkeleton({ version: 2, tables: [] })).toThrow();
  });

  it('拒掉重名的表', () => {
    expect(() => normalizeSkeleton({ version: 1, tables: [{ name: 'products' }, { name: 'products' }] })).toThrow();
  });

  it('拒掉指向不存在的表的关系', () => {
    expect(() =>
      normalizeSkeleton({
        version: 1,
        tables: [{ name: 'products' }],
        relations: [{ from: 'products', to: 'ghosts', cardinality: 'one-to-many' }],
      }),
    ).toThrow();
  });

  it('拒掉没听说过的基数', () => {
    expect(() =>
      normalizeSkeleton({
        version: 1,
        tables: [{ name: 'products' }],
        relations: [{ from: 'products', to: 'products', cardinality: 'one-to-some' }],
      }),
    ).toThrow();
  });

  it('拒掉不是数组的 tables 或 relations', () => {
    expect(() => normalizeSkeleton({ version: 1, tables: {} })).toThrow();
    expect(() => normalizeSkeleton({ version: 1, relations: 'x' })).toThrow();
  });
});
