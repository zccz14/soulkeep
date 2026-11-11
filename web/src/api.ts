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

export type TileState = 'growing' | 'pending' | 'shed';

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

/** 骨架是一份文档：表与表的关系，不写字段。 */
export interface Skeleton {
  version: 1;
  tables: SkeletonTable[];
  relations: SkeletonRelation[];
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
  skeleton: Skeleton;
  tiles: TileView[];
}

/** 列表多一个 owned：公开之后，桌面只把您自己的算成您养着的。 */
export interface ProductListItem extends ProductView {
  owned: boolean;
}

export function listProducts(sdk: SdkLike | null) {
  return api<{ products: ProductListItem[] }>(sdk, '/api/v1/products').then((data) => data.products);
}

export function getProduct(sdk: SdkLike | null, slug: string) {
  return api<ProductDetail>(sdk, `/api/v1/products/${encodeURIComponent(slug)}`);
}

export function updateProduct(
  sdk: SdkLike,
  slug: string,
  patch: { name?: string; oneLiner?: string; url?: string; repo?: string; visibility?: 'private' | 'public' },
) {
  return api<{ product: ProductView }>(sdk, `/api/v1/products/${slug}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
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

export function saveSkeleton(sdk: SdkLike, slug: string, skeleton: Skeleton) {
  return api<{ skeleton: Skeleton }>(sdk, `/api/v1/products/${slug}/skeleton`, {
    method: 'PUT',
    body: JSON.stringify(skeleton),
  });
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
