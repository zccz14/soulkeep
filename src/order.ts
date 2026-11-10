/** 序号之间留出空档：挪一次只改一行，空档磨平了才整串重排。 */
export const SLOT_STEP = 1024;

/** 落在 left 与 right 之间的一个序号；null 表示那一侧没有邻居。没有空位时返回 null。 */
export function slotBetween(left: number | null, right: number | null): number | null {
  if (left === null && right === null) return SLOT_STEP;
  if (left === null) return right! > 0 ? Math.floor(right! / 2) : null;
  if (right === null) return left + SLOT_STEP;
  return right - left > 1 ? left + Math.floor((right - left) / 2) : null;
}
