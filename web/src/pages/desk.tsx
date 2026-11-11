import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthMini } from 'auth-mini-react-components';
import { createProduct, listProducts, type ProductListItem, type ProductView, type SdkLike } from '../api';
import { hostOf } from '../links';
import { Badge, Button, Card, Empty, ErrorNote, Field, Kicker, Note, TextInput, Title } from '../ui';

function greeting(hour: number): string {
  if (hour < 5) return '夜还很深';
  if (hour < 11) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 19) return '下午好';
  return '晚上好';
}

export function DeskPage() {
  const { sdk, isAuthenticated } = useAuthMini();
  const typed = sdk as unknown as SdkLike | null;
  const [products, setProducts] = useState<ProductListItem[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null);
    listProducts(typed)
      .then(setProducts)
      .catch(setError);
  }, [typed]);

  useEffect(load, [load]);

  const mine = products?.filter((product) => product.owned && !product.isSample) ?? [];
  const samples = products?.filter((product) => product.isSample) ?? [];

  const submit = async () => {
    if (!typed) return;
    setBusy(true);
    setError(null);
    try {
      await createProduct(typed, { name, oneLiner });
      setName('');
      setOneLiner('');
      setOpen(false);
      load();
    } catch (problem) {
      setError(problem);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <Kicker>Soulkeep</Kicker>
          <h1 className="text-2xl font-semibold tracking-tight">
            创始人，{greeting(new Date().getHours())}。
          </h1>
          <Note>
            这里没有待办。它们的日常不需要您，只有那些「换掉它就不是它了」的决定，才会把您叫回来。
          </Note>
        </div>
        {isAuthenticated ? (
          <Button onClick={() => setOpen((value) => !value)}>{open ? '先不钉了' : '种一个新产品'}</Button>
        ) : null}
      </header>

      <ErrorNote error={error} />

      {open && isAuthenticated ? (
        <Card className="flex flex-col gap-3">
          <Title hint="名字和一句话身份，其余交给它自己长">新产品的第一笔</Title>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="它叫什么">
              <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：Linkit" />
            </Field>
            <Field label="一句话说清它是谁">
              <TextInput
                value={oneLiner}
                onChange={(event) => setOneLiner(event.target.value)}
                placeholder="例如：设备之间的消息，不必经过服务器。"
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={busy || !name.trim() || !oneLiner.trim()}>
              {busy ? '正在种下…' : '种下'}
            </Button>
          </div>
        </Card>
      ) : null}

      {products === null ? <Note>正在把它们请出来…</Note> : null}

      {isAuthenticated ? (
        <section className="flex flex-col gap-3">
          <Title hint={mine.length ? `您养着 ${mine.length} 个` : undefined}>您养着的</Title>
          {mine.length === 0 ? (
            <Empty>
              您还没有在这里种下产品。
              <br />
              钉下第一句灵魂，剩下的它会自己长。
            </Empty>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {mine.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {samples.length ? (
        <section className="flex flex-col gap-3">
          <Title hint="公开的示范产品，谁都能看">示范</Title>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {samples.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {!isAuthenticated ? (
        <Note>登录之后，这里会出现您自己的产品。上面这些示范不需要登录就能看。</Note>
      ) : null}
    </div>
  );
}

function ProductCard({ product }: { product: ProductView }) {
  return (
    <Link to={`/p/${product.slug}`} className="group block">
      <Card className="flex h-full flex-col gap-2 transition group-hover:border-foreground/30">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold tracking-tight">{product.name}</h3>
          {product.isSample ? <Badge>示范</Badge> : product.visibility === 'public' ? <Badge>公开</Badge> : <Badge>私有</Badge>}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{product.oneLiner}</p>
        {product.url ? <p className="text-xs text-muted-foreground/70">{hostOf(product.url)}</p> : null}
        <span className="mt-auto pt-2 text-xs text-muted-foreground opacity-0 transition group-hover:opacity-100">
          看它的三层 →
        </span>
      </Card>
    </Link>
  );
}
