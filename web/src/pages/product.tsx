import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthMini } from 'auth-mini-react-components';
import {
  addPart,
  addTile,
  getProduct,
  removePart,
  removeTile,
  saveSoul,
  setTileState,
  type PartKind,
  type ProductDetail,
  type Soul,
  type SdkLike,
  type TileState,
} from '../api';
import { SoulEditor } from '../components/soul-editor';
import { Badge, Button, Card, Empty, ErrorNote, Field, Kicker, Note, Select, TextInput, Title } from '../ui';

const PART_KINDS: PartKind[] = ['table', 'object', 'stack'];
const PART_LABEL: Record<PartKind, string> = { table: '表', object: '对外对象', stack: '技术栈' };
const TILE_LABEL: Record<TileState, string> = { growing: '长着', pending: '待补', shed: '已脱落' };
const NEXT_STATE: Record<TileState, TileState> = { growing: 'pending', pending: 'shed', shed: 'growing' };

export function ProductPage() {
  const { slug = '' } = useParams();
  const { sdk } = useAuthMini();
  const typed = sdk as unknown as SdkLike | null;
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    setError(null);
    getProduct(typed, slug)
      .then(setDetail)
      .catch(setError);
  }, [typed, slug]);

  useEffect(load, [load]);

  if (error) return <ErrorNote error={error} />;
  if (!detail) return <Note>正在看它长成什么样…</Note>;

  const { product, soul, parts, tiles } = detail;
  const editable = detail.canEdit;

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
          </div>
          <div className="flex gap-2">
            <Badge tone="strong">{soul.statements.length} 句</Badge>
            <Badge>{parts.length} 块骨架</Badge>
            <Badge>{tiles.length} 片血肉</Badge>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        <SoulPanel slug={product.slug} soul={soul} editable={editable} sdk={typed} onChanged={load} />
        <SkeletonPanel slug={product.slug} parts={parts} editable={editable} sdk={typed} onChanged={load} />
        <FleshPanel slug={product.slug} tiles={tiles} editable={editable} sdk={typed} onChanged={load} />
      </div>

      <Note>您不需要碰任何一行代码。这里要您看的，只有那几句别人替不了的话。</Note>
    </div>
  );
}

function SoulPanel({
  slug,
  soul,
  editable,
  sdk,
  onChanged,
}: {
  slug: string;
  soul: Soul;
  editable: boolean;
  sdk: SdkLike | null;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Soul>(soul);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(soul);

  useEffect(() => {
    setDraft(soul);
  }, [soul]);

  const save = async () => {
    if (!sdk) return;
    setSaving(true);
    setError(null);
    try {
      await saveSoul(sdk, slug, draft);
      onChanged();
    } catch (problem) {
      setError(problem);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <Title hint="一句话一条，顺序就是轻重">灵魂</Title>
      <Note>改的都是草稿，点保存才写回去；没保存就离开这一页，草稿就没了。</Note>
      <ErrorNote error={error} />

      <SoulEditor value={draft} editable={editable} onChange={setDraft} />

      {editable ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Button onClick={save} disabled={!dirty || saving}>
            {saving ? '保存中…' : '保存'}
          </Button>
          <Button variant="quiet" onClick={() => setDraft(soul)} disabled={!dirty || saving}>
            放弃修改
          </Button>
          <span className="text-xs text-muted-foreground">{dirty ? '有未保存的改动' : '和线上一致'}</span>
        </div>
      ) : null}
    </Card>
  );
}

function SkeletonPanel({
  slug,
  parts,
  editable,
  sdk,
  onChanged,
}: {
  slug: string;
  parts: ProductDetail['parts'];
  editable: boolean;
  sdk: SdkLike | null;
  onChanged: () => void;
}) {
  const [kind, setKind] = useState<PartKind>('table');
  const [name, setName] = useState('');
  const [error, setError] = useState<unknown>(null);

  const submit = async () => {
    if (!sdk) return;
    setError(null);
    try {
      await addPart(sdk, slug, { kind, name, note: '' });
      setName('');
      onChanged();
    } catch (problem) {
      setError(problem);
    }
  };

  const drop = async (id: string) => {
    if (!sdk) return;
    setError(null);
    try {
      await removePart(sdk, slug, id);
      onChanged();
    } catch (problem) {
      setError(problem);
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <Title hint="粗、少、难改">骨架</Title>
      <Note>概念、术语、关系。机器生成，您过目；它必须小到您一小时内能读完。</Note>
      <ErrorNote error={error} />

      <ul className="flex flex-col gap-1.5">
        {parts.length === 0 ? <Empty>还没有骨架。血肉这时候只是散着的一堆。</Empty> : null}
        {parts.map((part) => (
          <li key={part.id} className="flex items-start gap-2 rounded-md border border-border px-2.5 py-2 text-xs leading-relaxed">
            <span className="mt-0.5 shrink-0 rounded bg-muted/60 px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
              {PART_LABEL[part.kind]}
            </span>
            <span className="flex-1">
              {part.name}
              {part.note ? <span className="block text-[0.7rem] text-muted-foreground">{part.note}</span> : null}
            </span>
            {editable ? (
              <button
                type="button"
                onClick={() => drop(part.id)}
                className="shrink-0 text-muted-foreground transition hover:text-destructive"
                aria-label="拿掉这块骨架"
              >
                ×
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {editable ? (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <Field label="哪一类">
            <Select value={kind} onChange={(event) => setKind(event.target.value as PartKind)}>
              {PART_KINDS.map((value) => (
                <option key={value} value={value}>
                  {PART_LABEL[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="它叫什么">
            <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：钉" />
          </Field>
          <Button onClick={submit} disabled={!name.trim()}>
            加一块
          </Button>
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
