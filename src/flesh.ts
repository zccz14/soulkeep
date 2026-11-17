import { fail } from './http';
import type { Skeleton } from './skeleton';

/**
 * 血肉是骨架之下那一层：机器从真实产物里读回来的一层，不是人写的规格。
 * 它有三种，每种带着自己的 payload 形状——
 * - 表设计 table：这张表长什么样，锚在骨架里的某张表上。
 * - 功能 feature：它能做什么，落在哪个入口，动到哪几张表。
 * - 页面 page：人从哪条路由进去，能做什么。
 * 三者的 payload 都受 Schema 约束：多一个字段当场拒掉，引用骨架里没有的表当场拒掉。
 */

export type FleshKind = 'table' | 'feature' | 'page';

export type FleshState = 'growing' | 'pending' | 'shed';

export const FLESH_KINDS: FleshKind[] = ['table', 'feature', 'page'];

export const FLESH_STATES: FleshState[] = ['growing', 'pending', 'shed'];

export const FLESH_KIND_LABEL: Record<FleshKind, string> = {
  table: '表设计',
  feature: '功能',
  page: '页面',
};

export const FLESH_KIND_HINT: Record<FleshKind, string> = {
  table: '每张表长什么样：有哪些列、哪列是键',
  feature: '它能做什么：落在哪个入口，动到哪几张表',
  page: '人从哪条路由进去、能做什么',
};

export type ColumnKey = '' | 'pk' | 'fk' | 'unique';

export const COLUMN_KEYS: ColumnKey[] = ['', 'pk', 'fk', 'unique'];

export const COLUMN_KEY_LABEL: Record<ColumnKey, string> = {
  '': '',
  pk: '主键',
  fk: '外键',
  unique: '唯一',
};

export interface Column {
  name: string;
  type: string;
  key: ColumnKey;
  note: string;
}

export interface TablePayload {
  columns: Column[];
  note: string;
  source: string;
}

export interface FeaturePayload {
  does: string;
  entry: string;
  tables: string[];
  note: string;
  source: string;
}

export interface PagePayload {
  route: string;
  actions: string[];
  tables: string[];
  note: string;
  source: string;
}

export interface FleshPayloads {
  table: TablePayload;
  feature: FeaturePayload;
  page: PagePayload;
}

const MAX_COLUMNS = 80;
const MAX_COLUMN_NAME = 60;
const MAX_COLUMN_TYPE = 40;
const MAX_COLUMN_NOTE = 160;
const MAX_DOES = 200;
const MAX_ENTRY = 160;
const MAX_ROUTE = 120;
const MAX_NOTE = 400;
const MAX_SOURCE = 200;
const MAX_ACTIONS = 40;
const MAX_ACTION = 80;
const MAX_TABLES = 40;

/** 老血肉没有种类时按功能算：它原来做的就是这件事。 */
export function normalizeFleshKind(value: unknown): FleshKind {
  if (value === undefined || value === null || value === '') return 'feature';
  if (typeof value !== 'string') return fail(400, 'bad_request', '血肉的种类必须是文字');
  if (!FLESH_KINDS.includes(value as FleshKind)) {
    const labels = FLESH_KINDS.map((kind) => `${FLESH_KIND_LABEL[kind]}（${kind}）`).join(' / ');
    return fail(400, 'bad_request', `血肉的种类只能是 ${labels}`);
  }
  return value as FleshKind;
}

export function normalizeFleshState(value: unknown): FleshState {
  if (value === undefined || value === null || value === '') return 'growing';
  if (typeof value !== 'string' || !FLESH_STATES.includes(value as FleshState)) {
    return fail(400, 'bad_request', `血肉的状态只能是 ${FLESH_STATES.join(' / ')}`);
  }
  return value as FleshState;
}

/**
 * 只有表设计带锚，而且锚必须是骨架里真实存在的表。
 * 功能与页面不钉在某张表上：它们常常横跨好几张表，钉住一张会把它说小。
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

/** payload 的正文：写的时候只认一种形状，多一个字段都拒掉。 */
export function normalizeFleshPayload<K extends FleshKind>(
  kind: K,
  input: unknown,
  skeleton: Skeleton,
): FleshPayloads[K] {
  const payload = objectOf(input);
  const common = { note: noteOf(payload), source: sourceOf(payload) };
  if (kind === 'table') {
    only(payload, ['columns', 'note', 'source'], FLESH_KIND_LABEL.table);
    return { columns: columnsOf(payload.columns), ...common } as FleshPayloads[K];
  }
  if (kind === 'feature') {
    only(payload, ['does', 'entry', 'tables', 'note', 'source'], FLESH_KIND_LABEL.feature);
    return {
      does: textOf(payload.does, MAX_DOES, '功能做了什么', true),
      entry: textOf(payload.entry, MAX_ENTRY, '功能的入口', false),
      tables: tablesOf(payload.tables, skeleton, '功能'),
      ...common,
    } as FleshPayloads[K];
  }
  only(payload, ['route', 'actions', 'tables', 'note', 'source'], FLESH_KIND_LABEL.page);
  return {
    route: textOf(payload.route, MAX_ROUTE, '页面的路由', true),
    actions: actionsOf(payload.actions),
    tables: tablesOf(payload.tables, skeleton, '页面'),
    ...common,
  } as FleshPayloads[K];
}

/** 读的时候宽容：库里可能躺着上一版留下的形状，读不出来就当成还没读回。 */
export function readFleshPayload(kind: FleshKind, json: string): FleshPayloads[FleshKind] {
  let raw: unknown = {};
  try {
    raw = JSON.parse(json);
  } catch {
    raw = {};
  }
  const payload = (raw ?? {}) as Record<string, unknown>;
  const common = { note: stringOf(payload.note), source: stringOf(payload.source) };
  if (kind === 'table') {
    return { columns: columnsRead(payload.columns), ...common } as FleshPayloads[FleshKind];
  }
  if (kind === 'feature') {
    return {
      does: stringOf(payload.does),
      entry: stringOf(payload.entry),
      tables: stringsOf(payload.tables),
      ...common,
    } as FleshPayloads[FleshKind];
  }
  return {
    route: stringOf(payload.route),
    actions: stringsOf(payload.actions),
    tables: stringsOf(payload.tables),
    ...common,
  } as FleshPayloads[FleshKind];
}

function objectOf(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) {
    return fail(400, 'bad_request', '血肉的正文必须是一个对象');
  }
  return value as Record<string, unknown>;
}

function only(payload: Record<string, unknown>, allowed: string[], what: string): void {
  for (const key of Object.keys(payload)) {
    if (!allowed.includes(key)) return fail(400, 'bad_request', `${what}的正文里没有「${key}」这一项`);
  }
}

function textOf(value: unknown, max: number, what: string, required: boolean): string {
  if (value === undefined || value === null) {
    if (required) return fail(400, 'bad_request', `${what}不能空着`);
    return '';
  }
  if (typeof value !== 'string') return fail(400, 'bad_request', `${what}必须是文字`);
  const trimmed = value.trim();
  if (required && !trimmed) return fail(400, 'bad_request', `${what}不能空着`);
  if (trimmed.length > max) return fail(400, 'bad_request', `${what}最多 ${max} 个字`);
  return trimmed;
}

function stringOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function stringsOf(value: unknown, max = MAX_TABLES, perItem = MAX_ACTION): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').slice(0, max).map((item) => item.slice(0, perItem));
}

function noteOf(payload: Record<string, unknown>): string {
  return textOf(payload.note, MAX_NOTE, '血肉的备注', false);
}

function sourceOf(payload: Record<string, unknown>): string {
  return textOf(payload.source, MAX_SOURCE, '血肉的出处', false);
}

function actionsOf(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return fail(400, 'bad_request', '页面的动作必须是数组');
  if (value.length > MAX_ACTIONS) return fail(400, 'bad_request', `页面的动作最多 ${MAX_ACTIONS} 条`);
  return value.map((item) => textOf(item, MAX_ACTION, '页面的动作', true)).filter(Boolean);
}

/** 功能与页面说到的表，必须在骨架里：这就是「骨架管血肉」被检查的那一条。 */
function tablesOf(value: unknown, skeleton: Skeleton, what: string): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return fail(400, 'bad_request', `${what}动到的表必须是数组`);
  if (value.length > MAX_TABLES) return fail(400, 'bad_request', `${what}动到的表最多 ${MAX_TABLES} 张`);
  const names = new Set(skeleton.tables.map((table) => table.name));
  const seen = new Set<string>();
  return value.map((item) => {
    const name = textOf(item, MAX_COLUMN_NAME, `${what}动到的表`, true);
    if (!names.has(name)) return fail(400, 'bad_request', `骨架里没有「${name}」这张表，${what}不能先动它`);
    if (seen.has(name)) return fail(400, 'bad_request', `${what}把「${name}」写了两遍`);
    seen.add(name);
    return name;
  });
}

function columnsOf(value: unknown): Column[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return fail(400, 'bad_request', '表设计的列必须是数组');
  if (value.length > MAX_COLUMNS) return fail(400, 'bad_request', `一张表最多 ${MAX_COLUMNS} 列`);
  const seen = new Set<string>();
  return value.map((item) => {
    const column = objectOf(item);
    only(column, ['name', 'type', 'key', 'note'], '一列');
    const name = textOf(column.name, MAX_COLUMN_NAME, '列名', true);
    if (seen.has(name)) return fail(400, 'bad_request', `列名重了：${name}`);
    seen.add(name);
    const key = column.key === undefined || column.key === null || column.key === '' ? '' : column.key;
    if (typeof key !== 'string' || !COLUMN_KEYS.includes(key as ColumnKey)) {
      return fail(400, 'bad_request', `列的键只能是 ${COLUMN_KEYS.filter(Boolean).join(' / ')}`);
    }
    return {
      name,
      type: textOf(column.type, MAX_COLUMN_TYPE, '列的类型', false),
      key: key as ColumnKey,
      note: textOf(column.note, MAX_COLUMN_NOTE, '列的备注', false),
    };
  });
}

function columnsRead(value: unknown): Column[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_COLUMNS).map((item) => {
    const column = (item ?? {}) as Record<string, unknown>;
    const key = stringOf(column.key);
    return {
      name: stringOf(column.name),
      type: stringOf(column.type),
      key: (COLUMN_KEYS.includes(key as ColumnKey) ? key : '') as ColumnKey,
      note: stringOf(column.note),
    };
  });
}
