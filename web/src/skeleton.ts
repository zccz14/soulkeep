import type { Cardinality, Skeleton } from './api';

export const CARDINALITIES: Cardinality[] = ['one-to-one', 'one-to-many', 'many-to-many'];

export const CARDINALITY_LABEL: Record<Cardinality, string> = {
  'one-to-one': '一对一',
  'one-to-many': '一对多',
  'many-to-many': '多对多',
};

/** 空表名不算一张表；两头的表没了的 relation 也不算一条关系。 */
export function cleanSkeleton(skeleton: Skeleton): Skeleton {
  const tables = skeleton.tables
    .map((table) => ({ name: table.name.trim(), note: table.note.trim() }))
    .filter((table) => table.name);
  const names = new Set(tables.map((table) => table.name));
  return {
    version: 1,
    tables,
    relations: skeleton.relations.filter((relation) => names.has(relation.from) && names.has(relation.to)),
  };
}

export function sameSkeleton(left: Skeleton, right: Skeleton): boolean {
  return JSON.stringify(cleanSkeleton(left)) === JSON.stringify(cleanSkeleton(right));
}
