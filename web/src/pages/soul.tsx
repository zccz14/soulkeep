import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthMini } from 'auth-mini-react-components';
import { getProduct, saveSoul, type ProductDetail, type SdkLike, type Soul } from '../api';
import { SoulEditor } from '../components/soul-editor';
import { clearDraft, readDraft, writeDraft } from '../drafts';
import { cleanSoul, sameSoul } from '../soul';
import { Button, buttonClass, ErrorNote, Note } from '../ui';

const clock = (at: number) => new Date(at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
const stamp = (at: number) =>
  new Date(at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

function statusOf(saving: boolean, dirty: boolean, savedAt: number | null): string {
  if (saving) return '正在写回…';
  if (dirty) return '还没保存 · 草稿已存在本机';
  if (savedAt !== null) return `已保存 ${clock(savedAt)}`;
  return '和线上一致';
}

/**
 * 专门的灵魂编辑页：一页只做一件事——把那几句别人替不了的话写下来。
 * 每敲一个字都落一份本地草稿，刷新、关标签页都还在；点保存才整份写回线上。
 */
export function SoulPage() {
  const { slug = '' } = useParams();
  const { sdk } = useAuthMini();
  const typed = sdk as unknown as SdkLike | null;
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [draft, setDraft] = useState<Soul | null>(null);
  const [restoredAt, setRestoredAt] = useState<number | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [saveError, setSaveError] = useState<unknown>(null);

  const load = useCallback(() => {
    setError(null);
    getProduct(typed, slug)
      .then((loaded) => {
        setDetail(loaded);
        const local = readDraft(slug);
        if (local && !sameSoul(local.soul, loaded.soul)) {
          setDraft(local.soul);
          setRestoredAt(local.at);
          return;
        }
        clearDraft(slug);
        setDraft(loaded.soul);
      })
      .catch(setError);
  }, [typed, slug]);

  useEffect(load, [load]);

  const dirty = detail !== null && draft !== null && !sameSoul(draft, detail.soul);

  useEffect(() => {
    if (!draft) return;
    if (dirty) writeDraft(slug, draft);
    else clearDraft(slug);
  }, [slug, draft, dirty]);

  const save = async () => {
    if (!typed || !draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await saveSoul(typed, slug, cleanSoul(draft));
      setDetail((current) => (current ? { ...current, soul: saved.soul } : current));
      setDraft(saved.soul);
      setRestoredAt(null);
      setSavedAt(Date.now());
    } catch (problem) {
      setSaveError(problem);
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (!detail) return;
    setDraft(detail.soul);
    setRestoredAt(null);
    setSaveError(null);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's') return;
      event.preventDefault();
      if (dirty && !saving) void save();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (error) return <ErrorNote error={error} />;
  if (!detail || !draft) return <Note>正在把它的灵魂读出来…</Note>;

  if (!detail.canEdit) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-3">
        <Note>只有产品的拥有者能改它的灵魂。</Note>
        <Link className={buttonClass('quiet')} to={`/p/${slug}`}>
          回到 {detail.product.name}
        </Link>
      </div>
    );
  }

  return (
    <div className="-m-4 flex min-h-0 flex-1 flex-col md:-m-6">
      <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3 md:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link className="text-xs text-muted-foreground transition hover:text-foreground" to={`/p/${slug}`}>
            ← {detail.product.name}
          </Link>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-sm font-semibold">灵魂</span>
          <span className="hidden flex-1 sm:block" />
          <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
            <span className="flex-1 text-xs text-muted-foreground sm:flex-none">{statusOf(saving, dirty, savedAt)}</span>
            <Button variant="quiet" onClick={discard} disabled={!dirty || saving}>
              放弃修改
            </Button>
            <Button onClick={() => void save()} disabled={!dirty || saving}>
              {saving ? '保存中…' : '保存'}
            </Button>
          </div>
        </div>
        <ErrorNote error={saveError} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-6">
        {restoredAt !== null ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs">
            <span className="flex-1">接上了 {stamp(restoredAt)} 存在本机的草稿；线上那份还没变。</span>
            <Button variant="quiet" onClick={discard}>
              改用线上版本
            </Button>
          </div>
        ) : null}

        <header className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">{detail.product.name} · 灵魂</h1>
          <Note>
            改动会随手存在这台机器的浏览器里，刷新、关掉都不丢；点「保存」（或 ⌘S）才整份写回线上。
          </Note>
        </header>

        <SoulEditor value={draft} onChange={setDraft} />
      </div>
      </div>
    </div>
  );
}
