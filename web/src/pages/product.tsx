import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthMini } from 'auth-mini-react-components';
import {
  COLUMN_KEY_LABEL,
  FLESH_KIND_HINT,
  FLESH_KIND_LABEL,
  FLESH_STATE_LABEL,
  getProduct,
  updateProduct,
  type FeaturePayload,
  type FleshView,
  type PagePayload,
  type ProductDetail,
  type Skeleton,
  type Soul,
  type SdkLike,
  type TablePayload,
} from '../api';
import { SkeletonGraph } from '../components/skeleton-graph';
import { hostOf, repoHref, repoLabel } from '../links';
import { Badge, Button, buttonClass, Card, Empty, ErrorNote, Field, Kicker, Note, TextInput, Title } from '../ui';

/** 骨架里已经有表设计的表：表设计挂在表上，一张表一份。 */
function designedTables(detail: ProductDetail): number {
  const names = new Set(detail.skeleton.tables.map((table) => table.name));
  const grown = new Set(
    detail.flesh.filter((piece) => piece.kind === 'table' && names.has(piece.anchor)).map((piece) => piece.anchor),
  );
  return grown.size;
}

export function ProductPage() {
  const { slug = '' } = useParams();
  const { sdk } = useAuthMini();
  const typed = sdk as unknown as SdkLike | null;
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [oneLiner, setOneLiner] = useState('');
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

  const { product, soul, skeleton, flesh } = detail;
  const editable = detail.canEdit;

  const openEditor = () => {
    setName(product.name);
    setOneLiner(product.oneLiner);
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
      await updateProduct(typed, slug, { name, oneLiner, url, repo, visibility });
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
            <Badge>{designedTables(detail)} 张表有血肉</Badge>
            <Badge>{flesh.length} 片血肉</Badge>
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
          <Title hint="地址可以空着，名字与一句话不能">产品资料</Title>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="它叫什么">
              <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Cybion" />
            </Field>
            <Field label="一句话说清它是谁">
              <TextInput
                value={oneLiner}
                onChange={(event) => setOneLiner(event.target.value)}
                placeholder="Agent 应用的基础设施。"
              />
            </Field>
          </div>
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
            <Button onClick={() => void saveLinks()} disabled={saving || !name.trim() || !oneLiner.trim()}>
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
        <FleshPanel skeleton={skeleton} flesh={flesh} />
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

      <SkeletonGraph skeleton={skeleton} />
    </Card>
  );
}

const ROW = 'rounded-md border border-border px-2.5 py-2';

function StatePill({ state }: { state: FleshView['state'] }) {
  const tone =
    state === 'growing'
      ? 'bg-foreground/[0.08] text-foreground'
      : state === 'pending'
        ? 'bg-muted/60 text-muted-foreground'
        : 'bg-transparent text-muted-foreground line-through';
  return <span className={`shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] ${tone}`}>{FLESH_STATE_LABEL[state]}</span>;
}

function Source({ source }: { source: string }) {
  if (!source) return null;
  return <span className="shrink-0 font-mono text-[0.65rem] text-muted-foreground/70">{source}</span>;
}

function Chips({ items, label }: { items: string[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-1 text-xs text-muted-foreground">
      {label}
      {items.map((item) => (
        <span key={item} className="rounded bg-foreground/[0.06] px-1 font-mono text-[0.65rem] text-foreground">
          {item}
        </span>
      ))}
    </span>
  );
}

/** 表设计：一张表一份，列、键、类型都摆开。 */
function TableDesign({ piece }: { piece: FleshView }) {
  const payload = piece.payload as TablePayload;
  return (
    <li className={`${ROW} flex flex-col gap-1.5`}>
      <div className="flex flex-wrap items-baseline gap-2 text-xs">
        <StatePill state={piece.state} />
        <span className="font-mono font-medium">{piece.name}</span>
        {payload.columns.length > 0 ? (
          <span className="text-muted-foreground">{payload.columns.length} 列</span>
        ) : (
          <span className="text-muted-foreground">还没读回列</span>
        )}
        <span className="flex-1" />
        <Source source={payload.source} />
      </div>
      {payload.columns.length > 0 ? (
        <ul className="flex flex-col gap-0.5 border-t border-border/60 pt-1.5">
          {payload.columns.map((column) => (
            <li key={column.name} className="flex flex-wrap items-baseline gap-x-2 text-xs leading-relaxed">
              <span className="font-mono">{column.name}</span>
              {column.type ? <span className="text-muted-foreground">{column.type}</span> : null}
              {column.key ? (
                <span className="rounded bg-foreground/[0.1] px-1 text-[0.65rem]">{COLUMN_KEY_LABEL[column.key]}</span>
              ) : null}
              {column.note ? <span className="text-muted-foreground">{column.note}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {payload.note ? <p className="text-xs text-muted-foreground">{payload.note}</p> : null}
    </li>
  );
}

/** 功能：它能做什么、落在哪个入口、动到哪几张表。 */
function FeaturePiece({ piece }: { piece: FleshView }) {
  const payload = piece.payload as FeaturePayload;
  const dead = piece.state === 'shed';
  return (
    <li className={`${ROW} flex flex-wrap items-baseline gap-2 text-xs leading-relaxed`}>
      <StatePill state={piece.state} />
      <span className={`font-medium ${dead ? 'text-muted-foreground line-through' : ''}`}>{piece.name}</span>
      {payload.does ? <span className="text-muted-foreground">{payload.does}</span> : null}
      <span className="flex-1" />
      {payload.entry ? <span className="font-mono text-[0.65rem] text-muted-foreground">{payload.entry}</span> : null}
      <Chips items={payload.tables} label="动到" />
      <Source source={payload.source} />
    </li>
  );
}

/** 页面：人从哪条路由进去、能做什么。 */
function PagePiece({ piece }: { piece: FleshView }) {
  const payload = piece.payload as PagePayload;
  const dead = piece.state === 'shed';
  return (
    <li className={`${ROW} flex flex-wrap items-baseline gap-2 text-xs leading-relaxed`}>
      <StatePill state={piece.state} />
      <span className={`font-medium ${dead ? 'text-muted-foreground line-through' : ''}`}>{piece.name}</span>
      {payload.route ? <span className="font-mono text-[0.65rem] text-muted-foreground">{payload.route}</span> : null}
      {payload.note ? <span className="text-muted-foreground">{payload.note}</span> : null}
      <span className="flex-1" />
      <Chips items={payload.actions} label="能做" />
      <Chips items={payload.tables} label="动到" />
      <Source source={payload.source} />
    </li>
  );
}

function Group({ label, hint, count }: { label: string; hint: string; count: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-t border-border pt-3">
      <span className="text-xs font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
      <span className="ml-auto text-xs tabular-nums text-muted-foreground">{count}</span>
    </div>
  );
}

/**
 * 血肉是读回来的一层，不是写出来的一层：
 * 界面只把它摊开给人看，没有编辑入口——人一旦手写血肉，它就成了要先写好的规格。
 */
function FleshPanel({ skeleton, flesh }: { skeleton: Skeleton; flesh: FleshView[] }) {
  const tablePieces = flesh.filter((piece) => piece.kind === 'table');
  const designed = new Map(tablePieces.map((piece) => [piece.anchor, piece]));
  const tables = skeleton.tables;
  const bare = tables.filter((table) => !designed.has(table.name));
  const strays = tablePieces.filter((piece) => !tables.some((table) => table.name === piece.anchor));
  const features = flesh.filter((piece) => piece.kind === 'feature');
  const pages = flesh.filter((piece) => piece.kind === 'page');

  return (
    <Card className="flex flex-col gap-3">
      <Title hint="没有人守着">血肉</Title>
      <Note>
        骨架之下那一层，机器从真实产物里读回来，每天都在换。它分三种：表设计是每张表长什么样，功能是它能做什么，页面是人从哪条路由进去。
      </Note>

      <Group
        label={FLESH_KIND_LABEL.table}
        hint={FLESH_KIND_HINT.table}
        count={`${tables.length - bare.length}/${tables.length} 张表`}
      />
      {tables.length === 0 ? <Empty>骨架里还没有表，表设计没有落点。</Empty> : null}
      <ul className="flex flex-col gap-1.5">
        {tables.map((table) => {
          const piece = designed.get(table.name);
          if (piece) return <TableDesign key={piece.id} piece={piece} />;
          return (
            <li
              key={`bare-${table.name}`}
              className="flex flex-wrap items-baseline gap-2 rounded-md border border-dashed border-border px-2.5 py-2 text-xs leading-relaxed"
            >
              <span className="shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">还没读回</span>
              <span className="font-mono font-medium">{table.name}</span>
              <span className="flex-1 text-muted-foreground">
                {table.note || '这张表有哪些列、哪列是键，还没有人读回来。'}
              </span>
            </li>
          );
        })}
        {strays.map((piece) => (
          <li key={piece.id} className={`${ROW} flex flex-wrap items-baseline gap-2 text-xs`}>
            <StatePill state={piece.state} />
            <span className="font-mono font-medium">{piece.name}</span>
            <span className="flex-1 text-muted-foreground">这张表已经不在骨架里了</span>
          </li>
        ))}
      </ul>

      <Group label={FLESH_KIND_LABEL.feature} hint={FLESH_KIND_HINT.feature} count={`${features.length} 片`} />
      <ul className="flex flex-col gap-1.5">
        {features.length === 0 ? <Empty>还没有功能。</Empty> : null}
        {features.map((piece) => (
          <FeaturePiece key={piece.id} piece={piece} />
        ))}
      </ul>

      <Group label={FLESH_KIND_LABEL.page} hint={FLESH_KIND_HINT.page} count={`${pages.length} 片`} />
      <ul className="flex flex-col gap-1.5">
        {pages.length === 0 ? <Empty>还没有页面。</Empty> : null}
        {pages.map((piece) => (
          <PagePiece key={piece.id} piece={piece} />
        ))}
      </ul>

      <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
        这一层由机器写回，人不在界面上编辑：把这层改成规范，它就该先于实现写，那才是瀑布。机器读回一片就走
        <span className="font-mono"> POST /api/v1/products/:slug/flesh</span>，改一片走
        <span className="font-mono"> PATCH /api/v1/products/:slug/flesh/:id</span>，长不出来的走
        <span className="font-mono"> DELETE</span>。正文按种类过 Schema，引用到骨架里没有的表会被当场拒掉。
      </p>
    </Card>
  );
}
