import { generateKeyBetween } from 'fractional-indexing';

/**
 * 分数索引：在 before 与 after 之间取一把新键，两侧为 null 表示没有邻居。
 * 键只增不减、永远插得下，挪一颗钉子只写它自己那一行。
 */
export function rankBetween(before: string | null, after: string | null): string {
  return generateKeyBetween(before, after);
}
