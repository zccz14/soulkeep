import type { Env } from './env';
import { fail } from './http';
import { newId, nowSeconds, toSlug } from './ids';
import type { Principal } from './auth';

export type PinKind = 'why' | 'being' | 'never' | 'who';
export type PartKind = 'concept' | 'table' | 'object' | 'stack';
export type TileState = 'growing' | 'pending' | 'shed';

export interface ProductRow {
  id: string;
  owner_user_id: string;
  slug: string;
  name: string;
  one_liner: string;
  visibility: 'private' | 'public';
  is_sample: number;
  created_at: number;
  updated_at: number;
}

export interface PinRow {
  id: string;
  product_id: string;
  kind: PinKind;
  statement: string;
  slot: number;
  created_at: number;
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

export async function listPins(env: Env, productId: string): Promise<PinRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM soul_pins WHERE product_id = ? ORDER BY slot ASC, created_at ASC`,
  )
    .bind(productId)
    .all<PinRow>();
  return results ?? [];
}

export async function addPin(
  env: Env,
  product: ProductRow,
  input: { kind: PinKind; statement: string },
): Promise<PinRow> {
  const count = await env.DB.prepare(`SELECT COUNT(*) AS n FROM soul_pins WHERE product_id = ?`)
    .bind(product.id)
    .first<{ n: number }>();
  const row: PinRow = {
    id: newId('pin'),
    product_id: product.id,
    kind: input.kind,
    statement: input.statement.trim(),
    slot: count?.n ?? 0,
    created_at: nowSeconds(),
  };
  await env.DB.prepare(
    `INSERT INTO soul_pins (id, product_id, kind, statement, slot, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(row.id, row.product_id, row.kind, row.statement, row.slot, row.created_at)
    .run();
  await touch(env, product.id);
  return row;
}

/** 改一句话或改一类，不动次序。 */
export async function updatePin(
  env: Env,
  product: ProductRow,
  pinId: string,
  input: { statement?: string; kind?: PinKind },
): Promise<PinRow> {
  const row = await env.DB.prepare(`SELECT * FROM soul_pins WHERE id = ? AND product_id = ?`)
    .bind(pinId, product.id)
    .first<PinRow>();
  if (!row) return fail(404, 'not_found', '没有这颗钉');
  const next: PinRow = {
    ...row,
    statement: input.statement ?? row.statement,
    kind: input.kind ?? row.kind,
  };
  await env.DB.prepare(`UPDATE soul_pins SET kind = ?, statement = ? WHERE id = ?`)
    .bind(next.kind, next.statement, next.id)
    .run();
  await touch(env, product.id);
  return next;
}

/** 挪到第 target 位：整串重排一次，次序永远是 0..n-1。 */
export async function movePin(
  env: Env,
  product: ProductRow,
  pinId: string,
  target: number,
): Promise<void> {
  const rows = await listPins(env, product.id);
  const from = rows.findIndex((row) => row.id === pinId);
  if (from === -1) return fail(404, 'not_found', '没有这颗钉');
  const to = Math.min(Math.max(Math.trunc(target), 0), rows.length - 1);
  if (to === from) return;
  const [moved] = rows.splice(from, 1);
  rows.splice(to, 0, moved);
  await env.DB.batch(
    rows.map((row, index) => env.DB.prepare(`UPDATE soul_pins SET slot = ? WHERE id = ?`).bind(index, row.id)),
  );
  await touch(env, product.id);
}

export async function deletePin(env: Env, product: ProductRow, pinId: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM soul_pins WHERE id = ? AND product_id = ?`).bind(pinId, product.id).run();
  await touch(env, product.id);
}

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
