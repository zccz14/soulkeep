import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthMini } from 'auth-mini-react-components';
import { getProduct, saveSoul, type ProductDetail, type SdkLike, type Soul } from '../api';
import { DocumentPage } from '../components/document-page';
import { SoulEditor } from '../components/soul-editor';
import { useDocumentDraft } from '../document-draft';
import { cleanSoul } from '../soul';
import { buttonClass, ErrorNote, Note } from '../ui';

/**
 * 专门的灵魂编辑页：一页只做一件事——把那几句别人替不了的话写下来。
 * 每敲一个字都落一份本地草稿，刷新、关标签页都还在；点保存才整份写回线上。
 */
export function SoulPage() {
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

  const draft = useDocumentDraft<Soul>({
    slug,
    kind: 'soul',
    server: detail?.soul ?? null,
    clean: cleanSoul,
    save: async (next) => {
      if (!typed) throw new Error('没有登录');
      const saved = await saveSoul(typed, slug, next);
      setDetail((current) => (current ? { ...current, soul: saved.soul } : current));
      return saved.soul;
    },
  });

  if (error) return <ErrorNote error={error} />;
  if (!detail || !draft.draft) return <Note>正在把它的灵魂读出来…</Note>;

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
    <DocumentPage
      dirty={draft.dirty}
      hint="改动会随手存在这台机器的浏览器里，刷新、关掉都不丢；点「保存」（或 ⌘S）才整份写回线上。"
      onDiscard={draft.discard}
      onSave={() => void draft.saveNow()}
      productName={detail.product.name}
      restoredAt={draft.restoredAt}
      saveError={draft.saveError}
      savedAt={draft.savedAt}
      saving={draft.saving}
      slug={slug}
      title="灵魂"
    >
      <SoulEditor value={draft.draft} onChange={draft.update} />
    </DocumentPage>
  );
}
