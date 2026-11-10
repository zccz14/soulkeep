import { fail } from './http';

/**
 * 骨架先只做 ER：表本身，以及表与表的关系。
 * 不写字段——字段属于血肉，落在表里就会变成另一种东西。
 */
export type Cardinality = 'one-to-one' | 'one-to-many' | 'many-to-many';

export interface SkeletonTable {
  name: string;
  note: string;
}

export interface SkeletonRelation {
  from: string;
  to: string;
  cardinality: Cardinality;
}

export interface Skeleton {
  version: 1;
  tables: SkeletonTable[];
  relations: SkeletonRelation[];
}

export const EMPTY_SKELETON: Skeleton = { version: 1, tables: [], relations: [] };

export const CARDINALITIES: Cardinality[] = ['one-to-one', 'one-to-many', 'many-to-many'];

const MAX_TABLES = 100;
const MAX_TABLE_NAME = 60;
const MAX_TABLE_NOTE = 240;
const MAX_RELATIONS = 300;

export function parseSkeleton(json: string): Skeleton {
  return normalizeSkeleton(JSON.parse(json));
}

/** 只认一种形状：version 1 + 表 + 关系；关系两头必须落在已有的表上。别的都当场拒掉。 */
export function normalizeSkeleton(input: unknown): Skeleton {
  const document = (input ?? {}) as { version?: unknown; tables?: unknown; relations?: unknown };
  if (document.version !== undefined && document.version !== 1) {
    return fail(400, 'bad_request', `骨架的 version 只认 1，收到 ${String(document.version)}`);
  }
  const tables = tablesOf(document.tables);
  return { version: 1, tables, relations: relationsOf(document.relations, tables) };
}

function tablesOf(value: unknown): SkeletonTable[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return fail(400, 'bad_request', '骨架的 tables 必须是数组');
  if (value.length > MAX_TABLES) return fail(400, 'bad_request', `最多 ${MAX_TABLES} 张表`);
  const seen = new Set<string>();
  return value.map((item) => {
    const table = (item ?? {}) as { name?: unknown; note?: unknown };
    const name = nameOf(table.name);
    if (seen.has(name)) return fail(400, 'bad_request', `表名重了：${name}`);
    seen.add(name);
    return { name, note: noteOf(table.note) };
  });
}

function relationsOf(value: unknown, tables: SkeletonTable[]): SkeletonRelation[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return fail(400, 'bad_request', '骨架的 relations 必须是数组');
  if (value.length > MAX_RELATIONS) return fail(400, 'bad_request', `最多 ${MAX_RELATIONS} 条关系`);
  const names = new Set(tables.map((table) => table.name));
  return value.map((item) => {
    const relation = (item ?? {}) as { from?: unknown; to?: unknown; cardinality?: unknown };
    if (!CARDINALITIES.includes(relation.cardinality as Cardinality)) {
      return fail(400, 'bad_request', `关系只能是 ${CARDINALITIES.join(' / ')}`);
    }
    return {
      from: tableRefOf(relation.from, names, '关系的起点'),
      to: tableRefOf(relation.to, names, '关系的终点'),
      cardinality: relation.cardinality as Cardinality,
    };
  });
}

function nameOf(value: unknown): string {
  if (typeof value !== 'string') return fail(400, 'bad_request', '表名必须是文字');
  const trimmed = value.trim();
  if (!trimmed) return fail(400, 'bad_request', '表名不能为空');
  if (trimmed.length > MAX_TABLE_NAME) return fail(400, 'bad_request', `表名最多 ${MAX_TABLE_NAME} 个字`);
  return trimmed;
}

function noteOf(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return fail(400, 'bad_request', '表的备注必须是文字');
  const trimmed = value.trim();
  if (trimmed.length > MAX_TABLE_NOTE) return fail(400, 'bad_request', `表的备注最多 ${MAX_TABLE_NOTE} 个字`);
  return trimmed;
}

function tableRefOf(value: unknown, names: Set<string>, what: string): string {
  if (typeof value !== 'string') return fail(400, 'bad_request', `${what}必须是一张表`);
  const trimmed = value.trim();
  if (!names.has(trimmed)) return fail(400, 'bad_request', `${what}「${trimmed}」不在这份骨架里`);
  return trimmed;
}
