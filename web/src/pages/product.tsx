import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthMini } from 'auth-mini-react-components';
import {
  addTile,
  getProduct,
  removeTile,
  setTileState,
  updateProduct,
  type ProductDetail,
  type Skeleton,
  type Soul,
  type SdkLike,
  type TileState,
} from '../api';
import { hostOf, repoHref, repoLabel } from '../links';
import { CARDINALITY_LABEL } from '../skeleton';
import { Badge, Button, buttonClass, Card, Empty, ErrorNote, Field, Kicker, Note, TextInput, Title } from '../ui';

const TILE_LABEL: Record<TileState, string> = { growing: '长着', pending: '待补', shed: '已脱落' };
const NEXT_STATE: Record<TileState, TileState> = { growing: 'pending', pending: 'shed', shed: 'growing' };

export function ProductPage() {
  const { slug = '' } = useParams();
  const { sdk } = useAuthMini();
  const typed = sdk as unknown as SdkLike | null;
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState('');
  const [repo, setRepo] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<unknown>(null);

  const load = useCallback(() => {
    setError(null);
    getProduct(typed, slug)
      .then(setDetail)
      .catch(setError);
  }, [typed, slug]);

  useEffect(load, [load]);

  if (error) return <ErrorNote error={error} />;
  if (!detail) return <Note>正在看它长成什么样…</Note>;

  const { product, soul, skeleton, tiles } = detail;
  const editable = detail.canEdit;

  const openEditor = () => {
    setUrl(product.url);
    setRepo(product.repo);
    setVisibility(product.visibility);
    setFormError(null);
    setEditing(true);
  };

  const saveLinks = async () => {
    if (!typed) return;
    setSaving(true);
    setFormError(null);
    try {
      await updateProduct(typed, slug, { url, repo, visibility });
      setEditing(false);
      load();
    } catch (problem) {
      setFormError(problem);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            创始人桌面
          </Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Kicker>{product.isSample ? '示范产品' : '产品'}</Kicker>
            <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{product.oneLiner}</p>
            {product.url || product.repo ? (
              <div className="flex flex-wrap items-center gap-4 pt-0.5 text-xs">
                {product.url ? (
                  <a
                    className="text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline"
                    href={product.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {hostOf(product.url)} ↗
                  </a>
                ) : null}
                {product.repo ? (
                  <a
                    className="text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline"
                    href={repoHref(product.repo)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {repoLabel(product.repo)} ↗
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="strong">{soul.statements.length} 句</Badge>
            <Badge>{skeleton.tables.length} 张表</Badge>
            <Badge>{skeleton.relations.length} 条关系</Badge>
            <Badge>{tiles.length} 片血肉</Badge>
            {editable ? (
              <Button variant="quiet" onClick={openEditor}>
                编辑资料
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {editing ? (
        <Card className="flex flex-col gap-3">
          <Title hint="地址都可以空着">产品资料</Title>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="公开访问地址">
              <TextInput
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://cybion.ntnl.io"
              />
            </Field>
            <Field label="Git 地址">
              <TextInput
                value={repo}
                onChange={(event) => setRepo(event.target.value)}
                placeholder="github.com/zccz14/cybion"
              />
            </Field>
          </div>
          <div className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">谁能看</span>
            <div className="flex gap-2">
              {(['private', 'public'] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={visibility === value ? 'solid' : 'quiet'}
                  onClick={() => setVisibility(value)}
                >
                  {value === 'public' ? '公开：挂到广场上' : '私有：只有我自己'}
                </Button>
              ))}
            </div>
          </div>
          <ErrorNote error={formError} />
          <div className="flex gap-2">
            <Button onClick={() => void saveLinks()} disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </Button>
            <Button variant="quiet" onClick={() => setEditing(false)} disabled={saving}>
              取消
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="flex flex-col gap-4">
        <SoulPanel slug={product.slug} soul={soul} canEdit={editable} />
        <SkeletonPanel slug={product.slug} skeleton={skeleton} canEdit={editable} />
        <FleshPanel slug={product.slug} tiles={tiles} editable={editable} sdk={typed} onChanged={load} />
      </div>

      <Note>您不需要碰任何一行代码。这里要您看的，只有那几句别人替不了的话。</Note>
    </div>
  );
}

function SoulPanel({ slug, soul, canEdit }: { slug: string; soul: Soul; canEdit: boolean }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight">灵魂</h2>
        <span className="text-xs text-muted-foreground">一句话一条，顺序就是轻重</span>
        {canEdit ? (
          <Link className={buttonClass('quiet')} to={`/p/${slug}/soul`}>
            编辑灵魂
          </Link>
        ) : null}
      </div>

      {soul.statements.length === 0 ? (
        <Empty>还没有一句。它现在还没有形状。</Empty>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {soul.statements.map((line, index) => (
            <li key={index} className="flex gap-2 rounded-md border border-border px-2.5 py-2 text-xs leading-relaxed">
              <span className="shrink-0 tabular-nums text-muted-foreground/60">{String(index + 1).padStart(2, '0')}</span>
              <span className="flex-1">{line}</span>
            </li>
          ))}
        </ol>
      )}

      {soul.concepts.length > 0 ? (
        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">名词</p>
          <dl className="flex flex-col gap-1">
            {soul.concepts.map((concept, index) => (
              <div key={index} className="flex flex-wrap items-baseline gap-x-2 text-xs leading-relaxed">
                <dt className="font-medium">{concept.term}</dt>
                <dd className="text-muted-foreground">{concept.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </Card>
  );
}

function SkeletonPanel({ slug, skeleton, canEdit }: { slug: string; skeleton: Skeleton; canEdit: boolean }) {
  const empty = skeleton.tables.length === 0 && skeleton.relations.length === 0;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight">骨架</h2>
        <span className="text-xs text-muted-foreground">表与表的关系 · 不写字段</span>
        {canEdit ? (
          <Link className={buttonClass('quiet')} to={`/p/${slug}/skeleton`}>
            编辑骨架
          </Link>
        ) : null}
      </div>

      {empty ? <Empty>还没有骨架。它现在只是几句话。</Empty> : null}

      {skeleton.tables.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {skeleton.tables.map((table, index) => (
            <li key={index} className="flex items-baseline gap-2 rounded-md border border-border px-2.5 py-2 text-xs leading-relaxed">
              <span className="shrink-0 tabular-nums text-muted-foreground/60">{String(index + 1).padStart(2, '0')}</span>
              <span className="font-medium">{table.name}</span>
              {table.note ? <span className="text-muted-foreground">{table.note}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {skeleton.relations.length > 0 ? (
        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">关系</p>
          <ul className="flex flex-col gap-1.5">
            {skeleton.relations.map((relation, index) => (
              <li key={index} className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium">{relation.from}</span>
                <Badge tone="strong">{CARDINALITY_LABEL[relation.cardinality]}</Badge>
                <span className="font-medium">{relation.to}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}

function FleshPanel({
  slug,
  tiles,
  editable,
  sdk,
  onChanged,
}: {
  slug: string;
  tiles: ProductDetail['tiles'];
  editable: boolean;
  sdk: SdkLike | null;
  onChanged: () => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState<unknown>(null);

  const submit = async () => {
    if (!sdk) return;
    setError(null);
    try {
      await addTile(sdk, slug, { name, note: '' });
      setName('');
      onChanged();
    } catch (problem) {
      setError(problem);
    }
  };

  const cycle = async (id: string, state: TileState) => {
    if (!sdk) return;
    setError(null);
    try {
      await setTileState(sdk, slug, id, NEXT_STATE[state]);
      onChanged();
    } catch (problem) {
      setError(problem);
    }
  };

  const drop = async (id: string) => {
    if (!sdk) return;
    setError(null);
    try {
      await removeTile(sdk, slug, id);
      onChanged();
    } catch (problem) {
      setError(problem);
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <Title hint="没有人守着">血肉</Title>
      <Note>功能连线、字段、页面。每天都在换，坏了就换，不需要惊动您。</Note>
      <ErrorNote error={error} />

      <ul className="flex flex-col gap-1.5">
        {tiles.length === 0 ? <Empty>还没有血肉。它现在有形状，但还不能跑。</Empty> : null}
        {tiles.map((tile) => (
          <li key={tile.id} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-xs">
            <button
              type="button"
              disabled={!editable}
              onClick={() => cycle(tile.id, tile.state)}
              className={`shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] ${
                tile.state === 'growing'
                  ? 'bg-foreground/[0.08] text-foreground'
                  : tile.state === 'pending'
                    ? 'bg-muted/60 text-muted-foreground'
                    : 'bg-transparent text-muted-foreground line-through'
              }`}
            >
              {TILE_LABEL[tile.state]}
            </button>
            <span className={`flex-1 ${tile.state === 'shed' ? 'text-muted-foreground line-through' : ''}`}>{tile.name}</span>
            {editable ? (
              <button
                type="button"
                onClick={() => drop(tile.id)}
                className="shrink-0 text-muted-foreground transition hover:text-destructive"
                aria-label="拿掉这片血肉"
              >
                ×
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {editable ? (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <Field label="长一片新的">
            <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：导出对账单" />
          </Field>
          <Button onClick={submit} disabled={!name.trim()}>
            让它长
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
