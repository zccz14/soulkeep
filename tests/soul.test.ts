import { describe, expect, it } from 'vitest';
import { normalizeSoul, parseSoul } from '../src/soul';

describe('normalizeSoul', () => {
  it('留下非空的一句一句，顺序不动', () => {
    expect(normalizeSoul({ version: 1, statements: [' 甲 ', '', '乙'] }).statements).toEqual(['甲', '乙']);
  });

  it('概念带着术语与定义', () => {
    const soul = normalizeSoul({ version: 1, concepts: [{ term: ' 灵魂 ', definition: ' 一句话一条 ' }] });
    expect(soul.concepts).toEqual([{ term: '灵魂', definition: '一句话一条' }]);
  });

  it('老文档没有 concepts 时补成空数组', () => {
    expect(normalizeSoul({ version: 1, statements: ['甲'] }).concepts).toEqual([]);
  });

  it('拒掉别的版本', () => {
    expect(() => normalizeSoul({ version: 2, statements: [] })).toThrow();
  });

  it('拒掉不是数组的 statements 或 concepts', () => {
    expect(() => normalizeSoul({ version: 1, statements: '甲' })).toThrow();
    expect(() => normalizeSoul({ version: 1, concepts: {} })).toThrow();
  });

  it('拒掉缺定义或名字的概念', () => {
    expect(() => normalizeSoul({ version: 1, concepts: [{ term: '灵魂' }] })).toThrow();
    expect(() => normalizeSoul({ version: 1, concepts: [{ term: ' ', definition: '甲' }] })).toThrow();
  });

  it('存进去再读出来是同一份', () => {
    const soul = normalizeSoul({ version: 1, statements: ['甲'], concepts: [{ term: '乙', definition: '丙' }] });
    expect(parseSoul(JSON.stringify(soul))).toEqual(soul);
  });
});
