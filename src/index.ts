import { Hono } from 'hono';
import type { Env } from './env';
import { HttpError } from './http';
import { principalOf, type Principal } from './auth';
import { productRoutes } from './routes/products';

type Variables = { principal: Principal | null };

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.get('/api/v1/health', (c) =>
  c.json({ ok: true, service: 'soulkeep', version: '0.1.0', now: Math.floor(Date.now() / 1000) }),
);

app.get('/api/v1/me', async (c) => {
  const principal = await principalOf(c.req.raw, c.env);
  if (!principal) return c.json({ signedIn: false });
  return c.json({ signedIn: true, userId: principal.userId });
});

app.route('/api/v1/products', productRoutes);

app.notFound((c) => c.json({ error: 'not_found', message: `没有这个接口：${new URL(c.req.url).pathname}` }, 404));

app.onError((error, c) => {
  if (error instanceof HttpError) {
    return c.json({ error: error.code, message: error.message }, error.status as 400 | 401 | 403 | 404 | 409 | 500);
  }
  console.error('soulkeep error', error);
  return c.json({ error: 'internal_error', message: '服务内部错误' }, 500);
});

/** 静态资源与 SPA：Hash Router，所以只有 / 真正需要 index.html。 */
app.all('*', async (c) => {
  const { pathname } = new URL(c.req.url);
  if (pathname.startsWith('/api/')) {
    return c.json({ error: 'not_found', message: `没有这个接口：${pathname}` }, 404);
  }
  const response = await c.env.ASSETS.fetch(c.req.raw);
  if (response.status !== 404) return response;
  return c.env.ASSETS.fetch(new Request(new URL('/', c.req.url).toString(), c.req.raw));
});

export default app;
