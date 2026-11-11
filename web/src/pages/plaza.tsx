import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthMini } from 'auth-mini-react-components';
import { listProducts, type ProductView, type SdkLike } from '../api';
import { hostOf, repoLabel } from '../links';
import { Card, Empty, ErrorNote, Kicker, Note } from '../ui';

/** 广场只看公开的产品：私有的是创始人自己的草稿，不在这里露面。 */
export function PlazaPage() {
  const { sdk } = useAuthMini();
  const typed = sdk as unknown as SdkLike | null;
  const [products, setProducts] = useState<ProductView[] | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    setError(null);
    listProducts(typed)
      .then(setProducts)
      .catch(setError);
  }, [typed]);

  useEffect(load, [load]);

  const open = products?.filter((product) => product.visibility === 'public') ?? [];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <Kicker>广场</Kicker>
        <h1 className="text-2xl font-semibold tracking-tight">产品广场</h1>
        <Note>公开的产品线都在这里。灵魂、骨架、血肉，谁都能看。</Note>
      </header>

      <ErrorNote error={error} />

      {products === null ? <Note>正在把它们请出来…</Note> : null}
      {products !== null && open.length === 0 ? <Empty>还没有公开的产品。</Empty> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {open.map((product) => (
          <Link key={product.slug} to={`/p/${product.slug}`} className="group block">
            <Card className="flex h-full flex-col gap-2 transition group-hover:border-foreground/30">
              <h2 className="text-base font-semibold tracking-tight">{product.name}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{product.oneLiner}</p>
              <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-muted-foreground/70">
                {product.url ? <span>{hostOf(product.url)}</span> : null}
                {product.repo ? <span>{repoLabel(product.repo)}</span> : null}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
