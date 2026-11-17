import { fail } from './http';
import type { Skeleton } from './skeleton';

/**
 * 血肉是骨架之下那一层，机器自己长、每天在换。它先要说清自己是哪一种肉，
 * 才知道该按什么规矩长：
 * - 表设计：这张表长什么样——有哪些列、哪列是键、跟谁连着。它必须落在骨架的一张表上。
 * - 功能：它能做什么——一条接口、一段流程、一次校验。
 * - 页面：人看见什么、能点什么。
 * 骨架管血肉，最硬的一条就落在表设计上：不在骨架里的表，没有它的血肉。
 */
export type FleshKind = 'table' | 'feature' | 'page';

export const FLESH_KINDS: FleshKind[] = ['table', 'feature', 'page'];

export const FLESH_KIND_LABEL: Record<FleshKind, string> = {
  table: '表设计',
  feature: '功能',
  page: '页面',
};

export const FLESH_KIND_HINT: Record<FleshKind, string> = {
  table: '每张表长什么样：有哪些列、哪列是键、跟谁连着',
  feature: '它能做什么：一条接口、一段流程、一次校验',
  page: '人看见什么、能点什么',
};

/** 老血肉没有 kind 时按功能算：它原来做的就是这件事。 */
export function normalizeFleshKind(value: unknown): FleshKind {
  if (value === undefined || value === null || value === '') return 'feature';
  if (typeof value !== 'string') return fail(400, 'bad_request', '血肉的种类必须是文字');
  if (!FLESH_KINDS.includes(value as FleshKind)) {
    const labels = FLESH_KINDS.map((kind) => `${FLESH_KIND_LABEL[kind]}（${kind}）`).join(' / ');
    return fail(400, 'bad_request', `血肉的种类只能是 ${labels}`);
  }
  return value as FleshKind;
}

/**
 * 只有表设计带锚，而且锚必须是骨架里真实存在的表。
 * 其它两种不带锚：功能与页面可以横跨好几张表，钉在某一张上会把它说小。
 */
export function normalizeFleshAnchor(kind: FleshKind, value: unknown, skeleton: Skeleton): string {
  if (kind !== 'table') {
    if (value === undefined || value === null || value === '') return '';
    return fail(400, 'bad_request', `只有表设计能挂在某张表上，${FLESH_KIND_LABEL[kind]}不挂`);
  }
  if (typeof value !== 'string' || !value.trim()) {
    return fail(400, 'bad_request', '表设计要说明是骨架里的哪张表');
  }
  const name = value.trim();
  if (!skeleton.tables.some((table) => table.name === name)) {
    return fail(400, 'bad_request', `骨架里没有「${name}」这张表，血肉不能先长出去`);
  }
  return name;
}
