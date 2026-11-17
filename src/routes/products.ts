import { Hono } from 'hono';
import type { Env } from '../env';
import { fail } from '../http';
import { principalOf, requirePrincipal, type Principal } from '../auth';
import {
  addFlesh,
  createProduct,
  deleteFlesh,
  deleteProduct,
  listFlesh,
  listProducts,
  loadFlesh,
  loadOwnProduct,
  loadProduct,
  readSkeleton,
  readSoul,
  updateFlesh,
  updateProduct,
  writeSkeleton,
  writeSoul,
} from '../store';
import { normalizeRepo, normalizeUrl } from '../links';
import {
  normalizeFleshAnchor,
  normalizeFleshKind,
  normalizeFleshPayload,
  normalizeFleshState,
} from '../flesh';
import { normalizeSkeleton } from '../skeleton';
import { normalizeSoul } from '../soul';
import { fleshView, productListItem, productView } from '../views';

type Bindings = { Bindings: Env; Variables: { principal: Principal | null } };

export const productRoutes = new Hono<Bindings>();

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
  return c.json({ products: rows.map((row) => productListItem(row, principal?.userId ?? null)) });
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
  const flesh = await listFlesh(c.env, product.id);
  return c.json({
    product: productView(product),
    canEdit: principal !== null && principal.userId === product.owner_user_id,
    soul: readSoul(product),
    skeleton: readSkeleton(product),
    flesh: flesh.map(fleshView),
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
    url: body.url === undefined ? undefined : normalizeUrl(body.url),
    repo: body.repo === undefined ? undefined : normalizeRepo(body.repo),
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

/**
 * 机器把血肉喂回来：一片一行，正文按种类过 Schema。
 * 这一层没有给人用的编辑页——人来写血肉，它就成了要先写好的规格。
 */
productRoutes.post('/:slug/flesh', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const product = await loadOwnProduct(c.env, c.req.param('slug'), principal);
  const body = await c.req.json().catch(() => ({}));
  const skeleton = readSkeleton(product);
  const kind = normalizeFleshKind(body.kind);
  const anchor = normalizeFleshAnchor(kind, body.anchor, skeleton);
  const payload = normalizeFleshPayload(kind, body.payload, skeleton);
  const state = normalizeFleshState(body.state);
  if (kind === 'table') {
    const grown = await listFlesh(c.env, product.id);
    if (grown.some((row) => row.kind === 'table' && row.anchor === anchor)) {
      return fail(409, 'conflict', `「${anchor}」这张表已经有血肉了，改它，不用再长一份`);
    }
  }
  const row = await addFlesh(c.env, product, {
    // 表设计挂在表上，名字就是那张表的名字；另外两种自己起名。
    name: kind === 'table' ? anchor : text(body.name, '血肉名', 60),
    kind,
    anchor,
    state,
    payload: JSON.stringify(payload),
  });
  return c.json({ flesh: fleshView(row) }, 201);
});

/** 读回来的东西变了：整份正文换掉，读回的时间跟着走。 */
productRoutes.patch('/:slug/flesh/:fleshId', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const product = await loadOwnProduct(c.env, c.req.param('slug'), principal);
  const row = await loadFlesh(c.env, product, c.req.param('fleshId'));
  const body = await c.req.json().catch(() => ({}));
  const payload =
    body.payload === undefined
      ? undefined
      : JSON.stringify(normalizeFleshPayload(row.kind, body.payload, readSkeleton(product)));
  const state = body.state === undefined ? undefined : normalizeFleshState(body.state);
  if (payload === undefined && state === undefined) {
    return fail(400, 'bad_request', '要么换正文，要么改状态');
  }
  const next = await updateFlesh(c.env, product, row, { state, payload });
  return c.json({ flesh: fleshView(next) });
});

/** 东西没了：这片肉从骨架下脱落，直接从这一层拿掉。 */
productRoutes.delete('/:slug/flesh/:fleshId', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const product = await loadOwnProduct(c.env, c.req.param('slug'), principal);
  const row = await loadFlesh(c.env, product, c.req.param('fleshId'));
  await deleteFlesh(c.env, product, row.id);
  return c.body(null, 204);
});
