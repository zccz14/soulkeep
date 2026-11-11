import type { ProductRow, TileRow } from './store';

export interface ProductView {
  slug: string;
  name: string;
  oneLiner: string;
  visibility: 'private' | 'public';
  isSample: boolean;
  url: string;
  repo: string;
  updatedAt: number;
}

export function productView(row: ProductRow): ProductView {
  return {
    slug: row.slug,
    name: row.name,
    oneLiner: row.one_liner,
    visibility: row.visibility,
    isSample: row.is_sample === 1,
    url: row.url,
    repo: row.repo,
    updatedAt: row.updated_at,
  };
}

export function tileView(row: TileRow) {
  return { id: row.id, name: row.name, state: row.state, note: row.note };
}
