import { readFleshPayload } from './flesh';
import type { FleshRow, ProductRow } from './store';

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

/** 一片血肉带着它的种类与正文：表设计还带着挂在骨架哪张表上。 */
export function fleshView(row: FleshRow) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    anchor: row.anchor,
    state: row.state,
    payload: readFleshPayload(row.kind, row.payload),
    readAt: row.read_at,
  };
}
