import { describe, expect, it } from 'vitest';
import { isComposing } from '../web/src/keys';

describe('输入法组字', () => {
  it('组字中的回车算输入法的，不算界面的', () => {
    expect(isComposing({ nativeEvent: { isComposing: true } })).toBe(true);
  });

  it('组字结束时只留 keyCode 229 的浏览器也算组字', () => {
    expect(isComposing({ nativeEvent: { isComposing: false }, keyCode: 229 })).toBe(true);
  });

  it('平时按回车照常处理', () => {
    expect(isComposing({ nativeEvent: { isComposing: false }, keyCode: 13 })).toBe(false);
  });

  it('拿不到原生事件时不当成组字', () => {
    expect(isComposing({})).toBe(false);
  });
});
