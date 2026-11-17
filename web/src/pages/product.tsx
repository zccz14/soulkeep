import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthMini } from 'auth-mini-react-components';
import {
  addTile,
  FLESH_KIND_HINT,
  FLESH_KIND_LABEL,
  FLESH_KINDS,
  getProduct,
  removeTile,
  setTileState,
  updateProduct,
  type FleshKind,
  type ProductDetail,
  type Skeleton,
  type Soul,
  type SdkLike,
  type TileState,
  type TileView,
} from '../api';
import { SkeletonGraph } from '../components/skeleton-graph';
import { hostOf, repoHref, repoLabel } from '../links';
import { Badge, Button, buttonClass, Card, Empty, ErrorNote, Field, Kicker, Note, TextInput, Title } from '../ui';

const TILE_LABEL: Record<TileState, string> = { growing: '长着', pending: '待补', shed: '已脱落' };
const NEXT_STATE: Record<TileState, TileState> = { growing: 'pending', pending: 'shed', shed: 'growing' };

/** 骨架里已经有表设计的表：表设计挂在表上，一张表一份。 */
function designedTables(detail: ProductDetail): number {
  const names = new Set(detail.skeleton.tables.map((table) => table.name));
  const grown = new Set(
    detail.tiles.filter((tile) => tile.kind === 'table' && names.has(tile.anchor)).map((tile) => tile.anchor),
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

  const { product, soul, skeleton, tiles } = detail;
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
        <FleshPanel
          slug={product.slug}
          skeleton={skeleton}
          tiles={tiles}
          editable={editable}
          sdk={typed}
          onChanged={load}
        />
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

/** 一片血肉：状态能点，名字后面跟着它长成什么样。 */
function FleshRow({
  tile,
  editable,
  onCycle,
  onDrop,
  stray = false,
}: {
  tile: TileView;
  editable: boolean;
  onCycle: (id: string, state: TileState) => void;
  onDrop: (id: string) => void;
  stray?: boolean;
}) {
  const dead = tile.state === 'shed';
  return (
    <li className="flex flex-wrap items-baseline gap-2 rounded-md border border-border px-2.5 py-2 text-xs leading-relaxed">
      <button
        type="button"
        disabled={!editable}
        onClick={() => onCycle(tile.id, tile.state)}
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
      <span className={`font-medium ${dead ? 'text-muted-foreground line-through' : ''}`}>{tile.name}</span>
      {tile.note ? (
        <span className={`flex-1 text-muted-foreground ${dead ? 'line-through' : ''}`}>{tile.note}</span>
      ) : (
        <span className="flex-1" />
      )}
      {stray ? <span className="shrink-0 text-muted-foreground">这张表已经不在骨架里了</span> : null}
      {editable ? (
        <button
          type="button"
          onClick={() => onDrop(tile.id)}
          className="shrink-0 text-muted-foreground transition hover:text-destructive"
          aria-label="拿掉这片血肉"
        >
          ×
        </button>
      ) : null}
    </li>
  );
}

function FleshGroup({ label, hint, count }: { label: string; hint: string; count: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-t border-border pt-3">
      <span className="text-xs font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
      <span className="ml-auto text-xs tabular-nums text-muted-foreground">{count}</span>
    </div>
  );
}

/**
 * 血肉分三种，长法不一样：
 * 表设计挂在骨架的一张表上（一张表一份），功能和页面自己站着。
 * 骨架里还没有表设计的表也列出来——空着也是一种状态。
 */
function FleshPanel({
  slug,
  skeleton,
  tiles,
  editable,
  sdk,
  onChanged,
}: {
  slug: string;
  skeleton: Skeleton;
  tiles: ProductDetail['tiles'];
  editable: boolean;
  sdk: SdkLike | null;
  onChanged: () => void;
}) {
  const [kind, setKind] = useState<FleshKind>('feature');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [anchor, setAnchor] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const tableTiles = tiles.filter((tile) => tile.kind === 'table');
  const designed = new Map(tableTiles.map((tile) => [tile.anchor, tile]));
  const tables = skeleton.tables;
  const bare = tables.filter((table) => !designed.has(table.name));
  const strays = tableTiles.filter((tile) => !tables.some((table) => table.name === tile.anchor));
  const features = tiles.filter((tile) => tile.kind === 'feature');
  const pages = tiles.filter((tile) => tile.kind === 'page');

  const run = async (work: () => Promise<unknown>) => {
    setError(null);
    setBusy(true);
    try {
      await work();
      onChanged();
    } catch (problem) {
      setError(problem);
    } finally {
      setBusy(false);
    }
  };

  const grow = (input: { name: string; note: string; kind: FleshKind; anchor: string }) => {
    if (!sdk) return;
    return run(() => addTile(sdk, slug, input));
  };

  const submit = async () => {
    if (kind === 'table') {
      if (!anchor) return;
      await grow({ name: anchor, note: note.trim(), kind, anchor });
      setAnchor('');
      setNote('');
      return;
    }
    if (!name.trim()) return;
    await grow({ name: name.trim(), note: note.trim(), kind, anchor: '' });
    setName('');
    setNote('');
  };

  const canSubmit = kind === 'table' ? Boolean(anchor) : Boolean(name.trim());

  const cycle = (id: string, state: TileState) => {
    if (!sdk) return;
    void run(() => setTileState(sdk, slug, id, NEXT_STATE[state]));
  };

  const drop = (id: string) => {
    if (!sdk) return;
    void run(() => removeTile(sdk, slug, id));
  };

  return (
    <Card className="flex flex-col gap-3">
      <Title hint="没有人守着">血肉</Title>
      <Note>
        骨架之下那一层，每天都在换，坏了就换，不需要惊动您。它分三种：表设计是每张表长什么样，功能是它能做什么，页面是人看见什么。
      </Note>
      <ErrorNote error={error} />

      <FleshGroup
        label={FLESH_KIND_LABEL.table}
        hint={FLESH_KIND_HINT.table}
        count={`${tables.length - bare.length}/${tables.length} 张表`}
      />
      {tables.length === 0 ? <Empty>骨架里还没有表，表设计没有落点。</Empty> : null}
      <ul className="flex flex-col gap-1.5">
        {tables.map((table) => {
          const tile = designed.get(table.name);
          if (tile) return <FleshRow key={tile.id} tile={tile} editable={editable} onCycle={cycle} onDrop={drop} />;
          return (
            <li
              key={`bare-${table.name}`}
              className="flex flex-wrap items-baseline gap-2 rounded-md border border-dashed border-border px-2.5 py-2 text-xs leading-relaxed"
            >
              <span className="shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">还没长</span>
              <span className="font-medium">{table.name}</span>
              <span className="flex-1 text-muted-foreground">
                {table.note || '这张表的列、键与它跟谁连着，还没有人写下来。'}
              </span>
              {editable ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void grow({ name: table.name, note: '', kind: 'table', anchor: table.name })}
                  className="shrink-0 text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline"
                >
                  给它长一份
                </button>
              ) : null}
            </li>
          );
        })}
        {strays.map((tile) => (
          <FleshRow key={tile.id} tile={tile} editable={editable} onCycle={cycle} onDrop={drop} stray />
        ))}
      </ul>

      <FleshGroup label={FLESH_KIND_LABEL.feature} hint={FLESH_KIND_HINT.feature} count={`${features.length} 片`} />
      <ul className="flex flex-col gap-1.5">
        {features.length === 0 ? <Empty>还没有功能。</Empty> : null}
        {features.map((tile) => (
          <FleshRow key={tile.id} tile={tile} editable={editable} onCycle={cycle} onDrop={drop} />
        ))}
      </ul>

      <FleshGroup label={FLESH_KIND_LABEL.page} hint={FLESH_KIND_HINT.page} count={`${pages.length} 片`} />
      <ul className="flex flex-col gap-1.5">
        {pages.length === 0 ? <Empty>还没有页面。</Empty> : null}
        {pages.map((tile) => (
          <FleshRow key={tile.id} tile={tile} editable={editable} onCycle={cycle} onDrop={drop} />
        ))}
      </ul>

      {editable ? (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">长哪一种</span>
            {FLESH_KINDS.map((value) => (
              <Button
                key={value}
                type="button"
                variant={kind === value ? 'solid' : 'quiet'}
                onClick={() => setKind(value)}
              >
                {FLESH_KIND_LABEL[value]}
              </Button>
            ))}
          </div>

          {kind === 'table' ? (
            <Field label="挂在哪张表上">
              {bare.length === 0 ? (
                <Note>骨架里的每张表都有血肉了。</Note>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {bare.map((table) => (
                    <Button
                      key={table.name}
                      type="button"
                      variant={anchor === table.name ? 'solid' : 'quiet'}
                      onClick={() => setAnchor(table.name)}
                    >
                      {table.name}
                    </Button>
                  ))}
                </div>
              )}
            </Field>
          ) : (
            <Field label="它叫什么">
              <TextInput
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={kind === 'feature' ? '例如：导出对账单' : '例如：产品广场'}
              />
            </Field>
          )}

          <Field label="一句话说清它长成什么样">
            <TextInput value={note} onChange={(event) => setNote(event.target.value)} placeholder={FLESH_KIND_HINT[kind]} />
          </Field>

          <Button onClick={() => void submit()} disabled={busy || !canSubmit}>
            让它长
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
