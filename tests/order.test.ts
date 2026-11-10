import { describe, expect, it } from 'vitest';
import { SLOT_STEP, slotBetween } from '../src/order';

describe('slotBetween', () => {
  it('空表给第一颗留出整档空位', () => {
    expect(slotBetween(null, null)).toBe(SLOT_STEP);
  });

  it('往末尾加一颗，接在最后面', () => {
    expect(slotBetween(2048, null)).toBe(2048 + SLOT_STEP);
  });

  it('插到最前面只取一半，不动别人', () => {
    expect(slotBetween(null, 1024)).toBe(512);
  });

  it('中间落点取两边的中点', () => {
    expect(slotBetween(1024, 2048)).toBe(1536);
  });

  it('两块之间已经没有空位时交给整串重排', () => {
    expect(slotBetween(1024, 1025)).toBeNull();
    expect(slotBetween(null, 0)).toBeNull();
  });
});
