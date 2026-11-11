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

/** 列表里多一个「这条是不是您的」：公开之后，桌面不能把别人的产品算成您养着的。 */
export interface ProductListItem extends ProductView {
  owned: boolean;
}

export function productListItem(row: ProductRow, userId: string | null): ProductListItem {
  return { ...productView(row), owned: userId !== null && userId === row.owner_user_id };
}

export function tileView(row: TileRow) {
  return { id: row.id, name: row.name, state: row.state, note: row.note };
}
