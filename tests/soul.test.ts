import { describe, expect, it } from 'vitest';
import { normalizeSoul, parseSoul } from '../src/soul';

describe('normalizeSoul', () => {
  it('留下非空的一句一句，顺序不动', () => {
    expect(normalizeSoul({ version: 1, statements: [' 甲 ', '', '乙'] })).toEqual({
      version: 1,
      statements: ['甲', '乙'],
    });
  });

  it('省略 version 时按 1 处理', () => {
    expect(normalizeSoul({ statements: ['甲'] }).version).toBe(1);
  });

  it('拒掉别的版本', () => {
    expect(() => normalizeSoul({ version: 2, statements: [] })).toThrow();
  });

  it('拒掉不是数组的 statements', () => {
    expect(() => normalizeSoul({ version: 1, statements: '甲' })).toThrow();
    expect(() => normalizeSoul({ version: 1, statements: [1] })).toThrow();
  });

  it('存进去再读出来是同一份', () => {
    const soul = normalizeSoul({ version: 1, statements: ['甲', '乙'] });
    expect(parseSoul(JSON.stringify(soul))).toEqual(soul);
  });
});
