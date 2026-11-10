/** 只用到 session 的两个能力：结构类型，避免把 auth-mini 的完整类型拖进前端。 */
export interface SdkLike {
  session: {
    getState(): { accessToken?: string | null; expiresAt?: string | null };
    refresh(): Promise<{ accessToken?: string | null }>;
  };
}

/** 有会话就带上令牌，没有就当匿名访问——示例产品本来就允许匿名看。 */
async function maybeToken(sdk: SdkLike | null): Promise<string | null> {
  const session = sdk?.session.getState();
  if (!session?.accessToken) return null;
  const expiresAt = Date.parse(session.expiresAt ?? '');
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() + 30_000) {
    try {
      const refreshed = await sdk!.session.refresh();
      return refreshed.accessToken ?? null;
    } catch {
      return null;
    }
  }
  return session.accessToken;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
  }
}

export async function api<T>(sdk: SdkLike | null, path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...(init?.body ? { 'Content-Type': 'application/json' } : {}) };
  const token = await maybeToken(sdk);
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(path, { ...init, headers: { ...headers, ...init?.headers } });
  const body = await response.text();
  const parsed = body ? (JSON.parse(body) as unknown) : null;
  if (!response.ok) {
    const payload = (parsed ?? {}) as { error?: string; message?: string };
    throw new ApiError(payload.message ?? response.statusText, response.status, payload.error ?? 'error');
  }
  return parsed as T;
}

export type PartKind = 'table' | 'object' | 'stack';
export type TileState = 'growing' | 'pending' | 'shed';

export interface ProductView {
  slug: string;
  name: string;
  oneLiner: string;
  visibility: 'private' | 'public';
  isSample: boolean;
  updatedAt: number;
}

export interface PartView {
  id: string;
  kind: PartKind;
  name: string;
  note: string;
}

export interface TileView {
  id: string;
  name: string;
  state: TileState;
  note: string;
}

export interface Concept {
  term: string;
  definition: string;
}

export interface Soul {
  version: 1;
  statements: string[];
  concepts: Concept[];
}

export interface ProductDetail {
  product: ProductView;
  /** 只有拥有者能改；这是服务端算好的结论，前端不再自己推断。 */
  canEdit: boolean;
  soul: Soul;
  parts: PartView[];
  tiles: TileView[];
}

export function listProducts(sdk: SdkLike | null) {
  return api<{ products: ProductView[] }>(sdk, '/api/v1/products').then((data) => data.products);
}

export function getProduct(sdk: SdkLike | null, slug: string) {
  return api<ProductDetail>(sdk, `/api/v1/products/${encodeURIComponent(slug)}`);
}

export function createProduct(sdk: SdkLike, input: { name: string; oneLiner: string }) {
  return api<{ product: ProductView }>(sdk, '/api/v1/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** 灵魂整份写回：顺序就是数组顺序，不需要任何序号。 */
export function saveSoul(sdk: SdkLike, slug: string, soul: Soul) {
  return api<{ soul: Soul }>(sdk, `/api/v1/products/${slug}/soul`, {
    method: 'PUT',
    body: JSON.stringify(soul),
  });
}

export function addPart(sdk: SdkLike, slug: string, input: Omit<PartView, 'id'>) {
  return api<{ part: PartView }>(sdk, `/api/v1/products/${slug}/parts`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function removePart(sdk: SdkLike, slug: string, id: string) {
  return api<void>(sdk, `/api/v1/products/${slug}/parts/${id}`, { method: 'DELETE' });
}

export function addTile(sdk: SdkLike, slug: string, input: { name: string; note: string }) {
  return api<{ tile: TileView }>(sdk, `/api/v1/products/${slug}/tiles`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function setTileState(sdk: SdkLike, slug: string, id: string, state: TileState) {
  return api<void>(sdk, `/api/v1/products/${slug}/tiles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ state }),
  });
}

export function removeTile(sdk: SdkLike, slug: string, id: string) {
  return api<void>(sdk, `/api/v1/products/${slug}/tiles/${id}`, { method: 'DELETE' });
}
