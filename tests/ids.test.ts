import { describe, expect, it } from 'vitest';
import { toSlug } from '../src/ids';

describe('toSlug', () => {
  it('大写、空格与符号并成单个连字符', () => {
    expect(toSlug('Account Book!! 2026')).toBe('account-book-2026');
  });

  it('首尾与重复的连字符被收掉', () => {
    expect(toSlug('--a--b--')).toBe('a-b');
  });

  it('给不出 slug 的名字落回 p- 开头的短标识', () => {
    expect(toSlug('账簿')).toMatch(/^p-[0-9a-f]{8}$/);
  });
});
