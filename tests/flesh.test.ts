import { describe, expect, it } from 'vitest';
import { normalizeFleshAnchor, normalizeFleshKind } from '../src/flesh';
import { EMPTY_SKELETON, normalizeSkeleton } from '../src/skeleton';

const skeleton = normalizeSkeleton({
  version: 1,
  tables: [{ name: 'products' }, { name: 'flesh_tiles' }],
});

describe('normalizeFleshKind', () => {
  it('认得三种血肉：表设计、功能、页面', () => {
    expect(normalizeFleshKind('table')).toBe('table');
    expect(normalizeFleshKind('feature')).toBe('feature');
    expect(normalizeFleshKind('page')).toBe('page');
  });

  it('老血肉没有种类时按功能算', () => {
    expect(normalizeFleshKind(undefined)).toBe('feature');
    expect(normalizeFleshKind(null)).toBe('feature');
    expect(normalizeFleshKind('')).toBe('feature');
  });

  it('拒掉没听说过的种类', () => {
    expect(() => normalizeFleshKind('muscle')).toThrow();
    expect(() => normalizeFleshKind(1)).toThrow();
  });
});

describe('normalizeFleshAnchor', () => {
  it('表设计必须落在骨架里真实存在的表上', () => {
    expect(normalizeFleshAnchor('table', ' products ', skeleton)).toBe('products');
  });

  it('骨架里没有这张表就不许长', () => {
    expect(() => normalizeFleshAnchor('table', 'ghosts', skeleton)).toThrow();
    expect(() => normalizeFleshAnchor('table', 'products', EMPTY_SKELETON)).toThrow();
  });

  it('表设计不给表名就拒掉', () => {
    expect(() => normalizeFleshAnchor('table', '', skeleton)).toThrow();
    expect(() => normalizeFleshAnchor('table', undefined, skeleton)).toThrow();
  });

  it('功能与页面不带锚', () => {
    expect(normalizeFleshAnchor('feature', undefined, skeleton)).toBe('');
    expect(normalizeFleshAnchor('page', '', skeleton)).toBe('');
    expect(() => normalizeFleshAnchor('feature', 'products', skeleton)).toThrow();
    expect(() => normalizeFleshAnchor('page', 'products', skeleton)).toThrow();
  });
});
