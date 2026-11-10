import { describe, expect, it } from 'vitest';
import { rankBetween } from '../src/rank';

describe('rankBetween', () => {
  it('空表给第一颗一把键', () => {
    expect(rankBetween(null, null)).toMatch(/^[0-9A-Za-z]+$/);
  });

  it('插到最前面就比原来的头小', () => {
    expect(rankBetween(null, 'b001')! < 'b001').toBe(true);
  });

  it('接在末尾就比原来的尾大', () => {
    expect(rankBetween('b006', null) > 'b006').toBe(true);
  });

  it('中间落点严格落在两侧之间', () => {
    const key = rankBetween('b001', 'b002');
    expect('b001' < key && key < 'b002').toBe(true);
  });

  it('同一处反复插入两百次也不会撞车或失序', () => {
    let low = 'b001';
    const high = 'b002';
    for (let i = 0; i < 200; i += 1) {
      const key = rankBetween(low, high);
      expect(low < key && key < high).toBe(true);
      low = key;
    }
  });
});
