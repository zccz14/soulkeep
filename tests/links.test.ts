import { describe, expect, it } from 'vitest';
import { normalizeRepo, normalizeUrl } from '../src/links';

describe('normalizeUrl', () => {
  it('留 http(s) 地址，去掉两头空白', () => {
    expect(normalizeUrl(' https://cybion.ntnl.io ')).toBe('https://cybion.ntnl.io');
  });

  it('空字符串就是没配', () => {
    expect(normalizeUrl('')).toBe('');
  });

  it('拒掉没有协议的、带空白的、别的协议', () => {
    expect(() => normalizeUrl('cybion.ntnl.io')).toThrow();
    expect(() => normalizeUrl('https://a b')).toThrow();
    expect(() => normalizeUrl('ftp://cybion.ntnl.io')).toThrow();
  });
});

describe('normalizeRepo', () => {
  it('认 https、ssh 与简写', () => {
    expect(normalizeRepo('https://github.com/zccz14/soulkeep')).toBe('https://github.com/zccz14/soulkeep');
    expect(normalizeRepo('git@github.com:zccz14/soulkeep.git')).toBe('git@github.com:zccz14/soulkeep.git');
    expect(normalizeRepo('github.com/zccz14/soulkeep')).toBe('github.com/zccz14/soulkeep');
  });

  it('空字符串就是没配', () => {
    expect(normalizeRepo('  ')).toBe('');
  });

  it('拒掉带空白的', () => {
    expect(() => normalizeRepo('github.com/zccz14 soulkeep')).toThrow();
  });
});
