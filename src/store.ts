import type { Env } from './env';
import { fail } from './http';
import { newId, nowSeconds, toSlug } from './ids';
import { EMPTY_SOUL, parseSoul, type Soul } from './soul';
import type { Principal } from './auth';

export type PartKind = 'table' | 'object' | 'stack';
export type TileState = 'growing' | 'pending' | 'shed';

export interface ProductRow {
  id: string;
  owner_user_id: string;
  slug: string;
  name: string;
  one_liner: string;
  visibility: 'private' | 'public';
  is_sample: number;
  soul: string;
  created_at: number;
  updated_at: number;
}

export interface PartRow {
  id: string;
  product_id: string;
  kind: PartKind;
  name: string;
  note: string;
  slot: number;
  created_at: number;
}

export interface TileRow {
  id: string;
  product_id: string;
  name: string;
  state: TileState;
  note: string;
  slot: number;
  created_at: number;
}

export async function listProducts(env: Env, principal: Principal | null): Promise<ProductRow[]> {
  if (!principal) {
    const { results } = await env.DB.prepare(
      `SELECT * FROM products WHERE visibility = 'public' ORDER BY created_at ASC`,
    ).all<ProductRow>();
    return results ?? [];
  }
  const { results } = await env.DB.prepare(
    `SELECT * FROM products WHERE owner_user_id = ? OR visibility = 'public'
     ORDER BY (owner_user_id = ?) DESC, created_at ASC`,
  )
    .bind(principal.userId, principal.userId)
    .all<ProductRow>();
  return results ?? [];
}

/** 读：公开产品人人可看，私有产品只有拥有者能看；看不见的一律 404，不泄露存在性。 */
export async function loadProduct(env: Env, slug: string, principal: Principal | null): Promise<ProductRow> {
  const row = await env.DB.prepare(`SELECT * FROM products WHERE slug = ?`)
    .bind(slug)
    .first<ProductRow>();
  if (!row) return fail(404, 'not_found', '没有这个产品');
  if (row.visibility === 'public') return row;
  if (principal && principal.userId === row.owner_user_id) return row;
  return fail(404, 'not_found', '没有这个产品');
}

/** 灵魂就存在产品这一行里：读出来就是一份已经校验过的 JSON。 */
export function readSoul(row: ProductRow): Soul {
  return parseSoul(row.soul);
}

export async function writeSoul(env: Env, product: ProductRow, soul: Soul): Promise<void> {
  await env.DB.prepare(`UPDATE products SET soul = ? WHERE id = ?`)
    .bind(JSON.stringify(soul), product.id)
    .run();
  await touch(env, product.id);
}

/** 写：只有拥有者能改自己养的那一个。 */
export async function loadOwnProduct(env: Env, slug: string, principal: Principal): Promise<ProductRow> {
  const row = await env.DB.prepare(`SELECT * FROM products WHERE slug = ?`)
    .bind(slug)
    .first<ProductRow>();
  if (!row) return fail(404, 'not_found', '没有这个产品');
  if (row.owner_user_id !== principal.userId) return fail(403, 'forbidden', '这个产品不属于你');
  return row;
}

export async function createProduct(
  env: Env,
  ownerUserId: string,
  input: { name: string; oneLiner: string; slug?: string },
): Promise<ProductRow> {
  const now = nowSeconds();
  const row: ProductRow = {
    id: newId('prod'),
    owner_user_id: ownerUserId,
    slug: toSlug(input.slug || input.name),
    name: input.name.trim(),
    one_liner: input.oneLiner.trim(),
    visibility: 'private',
    is_sample: 0,
    soul: JSON.stringify(EMPTY_SOUL),
    created_at: now,
    updated_at: now,
  };
  const taken = await env.DB.prepare(`SELECT id FROM products WHERE slug = ?`).bind(row.slug).first();
  if (taken) return fail(409, 'conflict', `短名 ${row.slug} 已经被占用了`);
  await env.DB.prepare(
    `INSERT INTO products (id, owner_user_id, slug, name, one_liner, visibility, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(row.id, row.owner_user_id, row.slug, row.name, row.one_liner, row.visibility, row.created_at, row.updated_at)
    .run();
  return row;
}

export async function updateProduct(
  env: Env,
  product: ProductRow,
  input: { name?: string; oneLiner?: string; visibility?: 'private' | 'public' },
): Promise<ProductRow> {
  const next: ProductRow = {
    ...product,
    name: input.name?.trim() || product.name,
    one_liner: input.oneLiner?.trim() || product.one_liner,
    visibility: input.visibility ?? product.visibility,
    updated_at: nowSeconds(),
  };
  await env.DB.prepare(`UPDATE products SET name = ?, one_liner = ?, visibility = ?, updated_at = ? WHERE id = ?`)
    .bind(next.name, next.one_liner, next.visibility, next.updated_at, next.id)
    .run();
  return next;
}

export async function deleteProduct(env: Env, product: ProductRow): Promise<void> {
  await env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(product.id).run();
}

/** 改一句话或改一类，不动次序。 */
/** 挪到第 target 位：整串重排一次，次序永远是 0..n-1。 */
export async function listParts(env: Env, productId: string): Promise<PartRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM skeleton_parts WHERE product_id = ? ORDER BY slot ASC`,
  )
    .bind(productId)
    .all<PartRow>();
  return results ?? [];
}

export async function addPart(
  env: Env,
  product: ProductRow,
  input: { kind: PartKind; name: string; note: string },
): Promise<PartRow> {
  const count = await env.DB.prepare(`SELECT COUNT(*) AS n FROM skeleton_parts WHERE product_id = ?`)
    .bind(product.id)
    .first<{ n: number }>();
  const row: PartRow = {
    id: newId('part'),
    product_id: product.id,
    kind: input.kind,
    name: input.name.trim(),
    note: input.note.trim(),
    slot: count?.n ?? 0,
    created_at: nowSeconds(),
  };
  await env.DB.prepare(
    `INSERT INTO skeleton_parts (id, product_id, kind, name, note, slot, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(row.id, row.product_id, row.kind, row.name, row.note, row.slot, row.created_at)
    .run();
  await touch(env, product.id);
  return row;
}

export async function deletePart(env: Env, product: ProductRow, partId: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM skeleton_parts WHERE id = ? AND product_id = ?`).bind(partId, product.id).run();
  await touch(env, product.id);
}

export async function listTiles(env: Env, productId: string): Promise<TileRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM flesh_tiles WHERE product_id = ? ORDER BY slot ASC`,
  )
    .bind(productId)
    .all<TileRow>();
  return results ?? [];
}

export async function addTile(
  env: Env,
  product: ProductRow,
  input: { name: string; note: string },
): Promise<TileRow> {
  const count = await env.DB.prepare(`SELECT COUNT(*) AS n FROM flesh_tiles WHERE product_id = ?`)
    .bind(product.id)
    .first<{ n: number }>();
  const row: TileRow = {
    id: newId('tile'),
    product_id: product.id,
    name: input.name.trim(),
    state: 'growing',
    note: input.note.trim(),
    slot: count?.n ?? 0,
    created_at: nowSeconds(),
  };
  await env.DB.prepare(
    `INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(row.id, row.product_id, row.name, row.state, row.note, row.slot, row.created_at)
    .run();
  await touch(env, product.id);
  return row;
}

export async function setTileState(
  env: Env,
  product: ProductRow,
  tileId: string,
  state: TileState,
): Promise<void> {
  await env.DB.prepare(`UPDATE flesh_tiles SET state = ? WHERE id = ? AND product_id = ?`)
    .bind(state, tileId, product.id)
    .run();
  await touch(env, product.id);
}

export async function deleteTile(env: Env, product: ProductRow, tileId: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM flesh_tiles WHERE id = ? AND product_id = ?`).bind(tileId, product.id).run();
  await touch(env, product.id);
}

async function touch(env: Env, productId: string): Promise<void> {
  await env.DB.prepare(`UPDATE products SET updated_at = ? WHERE id = ?`).bind(nowSeconds(), productId).run();
}
