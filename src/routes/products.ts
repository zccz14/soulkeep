import { Hono } from 'hono';
import type { Env } from '../env';
import { fail } from '../http';
import { principalOf, requirePrincipal, type Principal } from '../auth';
import {
  addTile,
  createProduct,
  deleteProduct,
  deleteTile,
  listProducts,
  listTiles,
  loadOwnProduct,
  loadProduct,
  readSkeleton,
  readSoul,
  setTileState,
  updateProduct,
  writeSkeleton,
  writeSoul,
  type TileState,
} from '../store';
import { normalizeSkeleton } from '../skeleton';
import { normalizeSoul } from '../soul';
import { productView, tileView } from '../views';

type Bindings = { Bindings: Env; Variables: { principal: Principal | null } };

export const productRoutes = new Hono<Bindings>();

const TILE_STATES: TileState[] = ['growing', 'pending', 'shed'];

function text(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string') return fail(400, 'bad_request', `${field} 必须是文字`);
  const trimmed = value.trim();
  if (!trimmed) return fail(400, 'bad_request', `${field} 不能为空`);
  if (trimmed.length > max) return fail(400, 'bad_request', `${field} 最多 ${max} 个字`);
  return trimmed;
}

function oneOf<T extends string>(value: unknown, allowed: T[], field: string, fallback: T): T {
  if (value === undefined || value === null) return fallback;
  if (!allowed.includes(value as T)) return fail(400, 'bad_request', `${field} 只能是 ${allowed.join(' / ')}`);
  return value as T;
}

productRoutes.get('/', async (c) => {
  const principal = await principalOf(c.req.raw, c.env);
  const rows = await listProducts(c.env, principal);
  return c.json({ products: rows.map(productView) });
});

productRoutes.post('/', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const body = await c.req.json().catch(() => ({}));
  const name = text(body.name, '产品名', 80);
  const oneLiner = text(body.oneLiner ?? body.one_liner, '一句话身份', 200);
  const row = await createProduct(c.env, principal.userId, { name, oneLiner });
  return c.json({ product: productView(row) }, 201);
});

productRoutes.get('/:slug', async (c) => {
  const principal = await principalOf(c.req.raw, c.env);
  const product = await loadProduct(c.env, c.req.param('slug'), principal);
  const tiles = await listTiles(c.env, product.id);
  return c.json({
    product: productView(product),
    canEdit: principal !== null && principal.userId === product.owner_user_id,
    soul: readSoul(product),
    skeleton: readSkeleton(product),
    tiles: tiles.map(tileView),
  });
});

productRoutes.patch('/:slug', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const product = await loadOwnProduct(c.env, c.req.param('slug'), principal);
  const body = await c.req.json().catch(() => ({}));
  const next = await updateProduct(c.env, product, {
    name: body.name === undefined ? undefined : text(body.name, '产品名', 80),
    oneLiner: body.oneLiner === undefined ? undefined : text(body.oneLiner, '一句话身份', 200),
    visibility:
      body.visibility === undefined ? undefined : oneOf(body.visibility, ['private', 'public'] as const, '可见性', 'private'),
  });
  return c.json({ product: productView(next) });
});

productRoutes.delete('/:slug', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const product = await loadOwnProduct(c.env, c.req.param('slug'), principal);
  await deleteProduct(c.env, product);
  return c.body(null, 204);
});

productRoutes.put('/:slug/soul', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const product = await loadOwnProduct(c.env, c.req.param('slug'), principal);
  const soul = normalizeSoul(await c.req.json().catch(() => null));
  await writeSoul(c.env, product, soul);
  return c.json({ soul });
});

productRoutes.put('/:slug/skeleton', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const product = await loadOwnProduct(c.env, c.req.param('slug'), principal);
  const skeleton = normalizeSkeleton(await c.req.json().catch(() => null));
  await writeSkeleton(c.env, product, skeleton);
  return c.json({ skeleton });
});

productRoutes.post('/:slug/tiles', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const product = await loadOwnProduct(c.env, c.req.param('slug'), principal);
  const body = await c.req.json().catch(() => ({}));
  const tile = await addTile(c.env, product, {
    name: text(body.name, '血肉名', 60),
    note: typeof body.note === 'string' ? body.note.trim().slice(0, 240) : '',
  });
  return c.json({ tile: tileView(tile) }, 201);
});

productRoutes.patch('/:slug/tiles/:tileId', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const product = await loadOwnProduct(c.env, c.req.param('slug'), principal);
  const body = await c.req.json().catch(() => ({}));
  await setTileState(c.env, product, c.req.param('tileId'), oneOf(body.state, TILE_STATES, '状态', 'growing'));
  return c.body(null, 204);
});

productRoutes.delete('/:slug/tiles/:tileId', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const product = await loadOwnProduct(c.env, c.req.param('slug'), principal);
  await deleteTile(c.env, product, c.req.param('tileId'));
  return c.body(null, 204);
});
