import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthMini } from 'auth-mini-react-components';
import { getProduct, saveSkeleton, type ProductDetail, type SdkLike, type Skeleton } from '../api';
import { DocumentPage } from '../components/document-page';
import { SkeletonEditor } from '../components/skeleton-editor';
import { useDocumentDraft } from '../document-draft';
import { cleanSkeleton } from '../skeleton';
import { buttonClass, ErrorNote, Note } from '../ui';

/**
 * 骨架编辑页：先只做 ER——有哪些表、表与表怎么连。
 * 与灵魂一样：改动随手存在本机，点保存才整份写回。
 */
export function SkeletonPage() {
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

  const draft = useDocumentDraft<Skeleton>({
    slug,
    kind: 'skeleton',
    server: detail?.skeleton ?? null,
    clean: cleanSkeleton,
    save: async (next) => {
      if (!typed) throw new Error('没有登录');
      const saved = await saveSkeleton(typed, slug, next);
      setDetail((current) => (current ? { ...current, skeleton: saved.skeleton } : current));
      return saved.skeleton;
    },
  });

  if (error) return <ErrorNote error={error} />;
  if (!detail || !draft.draft) return <Note>正在把它的骨架读出来…</Note>;

  if (!detail.canEdit) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-3">
        <Note>只有产品的拥有者能改它的骨架。</Note>
        <Link className={buttonClass('quiet')} to={`/p/${slug}`}>
          回到 {detail.product.name}
        </Link>
      </div>
    );
  }

  return (
    <DocumentPage
      dirty={draft.dirty}
      hint="先只有表和表的关系：谁和谁怎么连。字段属于血肉，不写在骨架里；点「保存」（或 ⌘S）整份写回。"
      onDiscard={draft.discard}
      onSave={() => void draft.saveNow()}
      productName={detail.product.name}
      restoredAt={draft.restoredAt}
      saveError={draft.saveError}
      savedAt={draft.savedAt}
      saving={draft.saving}
      slug={slug}
      title="骨架"
    >
      <SkeletonEditor value={draft.draft} onChange={draft.update} />
    </DocumentPage>
  );
}
