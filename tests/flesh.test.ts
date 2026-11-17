import { describe, expect, it } from 'vitest';
import {
  normalizeFleshAnchor,
  normalizeFleshKind,
  normalizeFleshPayload,
  normalizeFleshState,
  readFleshPayload,
} from '../src/flesh';
import { EMPTY_SKELETON, normalizeSkeleton } from '../src/skeleton';

const skeleton = normalizeSkeleton({
  version: 1,
  tables: [{ name: 'products' }, { name: 'flesh' }],
});

describe('normalizeFleshKind / normalizeFleshState', () => {
  it('认得三种血肉', () => {
    expect(normalizeFleshKind('table')).toBe('table');
    expect(normalizeFleshKind('feature')).toBe('feature');
    expect(normalizeFleshKind('page')).toBe('page');
  });

  it('老血肉没有种类时按功能算', () => {
    expect(normalizeFleshKind(undefined)).toBe('feature');
    expect(normalizeFleshKind('')).toBe('feature');
  });

  it('拒掉没听说过的种类与状态', () => {
    expect(() => normalizeFleshKind('muscle')).toThrow();
    expect(normalizeFleshState(undefined)).toBe('growing');
    expect(normalizeFleshState('shed')).toBe('shed');
    expect(() => normalizeFleshState('rotting')).toThrow();
  });
});

describe('normalizeFleshAnchor', () => {
  it('表设计必须落在骨架里真实存在的表上', () => {
    expect(normalizeFleshAnchor('table', ' products ', skeleton)).toBe('products');
    expect(() => normalizeFleshAnchor('table', 'ghosts', skeleton)).toThrow();
    expect(() => normalizeFleshAnchor('table', '', EMPTY_SKELETON)).toThrow();
  });

  it('功能与页面不带锚', () => {
    expect(normalizeFleshAnchor('feature', undefined, skeleton)).toBe('');
    expect(() => normalizeFleshAnchor('page', 'products', skeleton)).toThrow();
  });
});

describe('normalizeFleshPayload', () => {
  it('表设计的正文是列：名字、类型、键、备注', () => {
    const payload = normalizeFleshPayload(
      'table',
      { columns: [{ name: ' id ', type: 'TEXT', key: 'pk', note: '主键' }], source: 'src/store.ts' },
      skeleton,
    );
    expect(payload).toEqual({
      columns: [{ name: 'id', type: 'TEXT', key: 'pk', note: '主键' }],
      note: '',
      source: 'src/store.ts',
    });
  });

  it('列名不能重，列的键只能是那三种', () => {
    expect(() =>
      normalizeFleshPayload('table', { columns: [{ name: 'id' }, { name: 'id' }] }, skeleton),
    ).toThrow();
    expect(() => normalizeFleshPayload('table', { columns: [{ name: 'id', key: 'index' }] }, skeleton)).toThrow();
  });

  it('功能的正文说清它做什么、落在哪个入口、动到哪几张表', () => {
    const payload = normalizeFleshPayload(
      'feature',
      { does: '把灵魂整份写回', entry: 'PUT /soul', tables: ['products'] },
      skeleton,
    );
    expect(payload).toEqual({
      does: '把灵魂整份写回',
      entry: 'PUT /soul',
      tables: ['products'],
      note: '',
      source: '',
    });
  });

  it('功能与页面动到骨架里没有的表就当场拒掉', () => {
    expect(() => normalizeFleshPayload('feature', { does: 'x', tables: ['ghosts'] }, skeleton)).toThrow();
    expect(() => normalizeFleshPayload('page', { route: '#/x', tables: ['ghosts'] }, skeleton)).toThrow();
  });

  it('页面的正文是路由与动作', () => {
    const payload = normalizeFleshPayload('page', { route: '#/plaza', actions: ['看公开的产品'] }, skeleton);
    expect(payload).toMatchObject({ route: '#/plaza', actions: ['看公开的产品'], tables: [] });
  });

  it('功能不说清做什么就拒掉，页面不给路由就拒掉', () => {
    expect(() => normalizeFleshPayload('feature', { does: '  ' }, skeleton)).toThrow();
    expect(() => normalizeFleshPayload('page', { actions: ['点一下'] }, skeleton)).toThrow();
  });

  it('正文里多一个字段就拒掉：这是 Schema，不是备注', () => {
    expect(() => normalizeFleshPayload('feature', { does: 'x', mood: 'good' }, skeleton)).toThrow();
    expect(() => normalizeFleshPayload('table', { columns: [], extra: 1 }, skeleton)).toThrow();
  });

  it('正文不是对象就拒掉', () => {
    expect(() => normalizeFleshPayload('table', 'columns', skeleton)).toThrow();
    expect(() => normalizeFleshPayload('table', [1, 2], skeleton)).toThrow();
  });
});

describe('readFleshPayload', () => {
  it('读得回来', () => {
    expect(readFleshPayload('feature', '{"does":"跑一轮","tables":["flesh"]}')).toMatchObject({
      does: '跑一轮',
      tables: ['flesh'],
    });
  });

  it('库里躺着坏 JSON 也不炸，当成还没读回', () => {
    expect(readFleshPayload('table', 'not json')).toEqual({ columns: [], note: '', source: '' });
    expect(readFleshPayload('page', 'null')).toEqual({ route: '', actions: [], tables: [], note: '', source: '' });
  });
});
