import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Env } from './env';
import { fail } from './http';

export interface Principal {
  userId: string;
  /** dev 只在本机出现，用来免登录跑通界面。 */
  kind: 'user' | 'dev';
}

type Jwks = ReturnType<typeof createRemoteJWKSet>;

/** 每个 isolate 内按 issuer 缓存 JWKS；jose 自己再做 stale-while-revalidate。 */
const keySets = new Map<string, Jwks>();

function keySet(issuer: string): Jwks {
  let cached = keySets.get(issuer);
  if (!cached) {
    cached = createRemoteJWKSet(new URL('/jwks', issuer), {
      cacheMaxAge: 600_000,
      cooldownDuration: 30_000,
    });
    keySets.set(issuer, cached);
  }
  return cached;
}

export function bearerOf(request: Request): string | null {
  const header = request.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

/** 可匿名：没有 Authorization 时返回 null，不报错。 */
export async function principalOf(request: Request, env: Env): Promise<Principal | null> {
  const raw = bearerOf(request);
  if (!raw) return null;
  if (env.DEV_USER_ID && raw === 'dev') return { userId: env.DEV_USER_ID, kind: 'dev' };
  try {
    const { payload } = await jwtVerify(raw, keySet(env.AUTH_ISSUER), {
      issuer: env.AUTH_ISSUER,
      audience: env.AUTH_AUDIENCE,
    });
    if (!payload.sub) return fail(401, 'unauthorized', '令牌缺少 sub');
    return { userId: payload.sub, kind: 'user' };
  } catch (error) {
    if (error instanceof Error && error.name === 'HttpError') throw error;
    return fail(401, 'unauthorized', '登录状态已过期，请重新登录');
  }
}

/** 必须登录。 */
export async function requirePrincipal(request: Request, env: Env): Promise<Principal> {
  const principal = await principalOf(request, env);
  if (!principal) return fail(401, 'unauthorized', '请先登录');
  return principal;
}
