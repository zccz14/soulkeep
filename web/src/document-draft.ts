import { useEffect, useRef, useState } from 'react';
import { clearDraft, readDraft, writeDraft, type DocumentKind } from './drafts';

export interface DocumentDraft<T> {
  draft: T | null;
  dirty: boolean;
  saving: boolean;
  restoredAt: number | null;
  savedAt: number | null;
  saveError: unknown;
  update: (next: T) => void;
  saveNow: () => void;
  discard: () => void;
}

/**
 * 一份文档的草稿：每敲一个字就存在这台机器上，点保存才整份写回。
 * 灵魂与骨架只是文档形状不同，这套行为对它们是一样的。
 */
export function useDocumentDraft<T>({
  slug,
  kind,
  server,
  clean,
  save,
}: {
  slug: string;
  kind: DocumentKind;
  server: T | null;
  clean: (value: T) => T;
  save: (next: T) => Promise<T>;
}): DocumentDraft<T> {
  const [draft, setDraft] = useState<T | null>(null);
  const [restoredAt, setRestoredAt] = useState<number | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  /** 只在这一页刚打开、线上那份到位时接一次本机草稿；保存之后换来的新线上版本不该再回头改草稿。 */
  const restoredFor = useRef<string | null>(null);

  useEffect(() => {
    if (server === null || restoredFor.current === slug) return;
    restoredFor.current = slug;
    const local = readDraft<T>(kind, slug);
    if (local && JSON.stringify(clean(local.document)) !== JSON.stringify(clean(server))) {
      setDraft(local.document);
      setRestoredAt(local.at);
      return;
    }
    clearDraft(kind, slug);
    setDraft(server);
    setRestoredAt(null);
  }, [slug, kind, server, clean]);

  const dirty =
    draft !== null && server !== null && JSON.stringify(clean(draft)) !== JSON.stringify(clean(server));

  useEffect(() => {
    if (draft === null) return;
    if (dirty) writeDraft(kind, slug, draft);
    else clearDraft(kind, slug);
  }, [slug, kind, draft, dirty]);

  const saveNow = async () => {
    if (draft === null) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await save(clean(draft));
      setDraft(saved);
      setRestoredAt(null);
      setSavedAt(Date.now());
    } catch (problem) {
      setSaveError(problem);
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (server === null) return;
    setDraft(server);
    setRestoredAt(null);
    setSaveError(null);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's') return;
      event.preventDefault();
      if (dirty && !saving) void saveNow();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return { draft, dirty, saving, restoredAt, savedAt, saveError, update: setDraft, saveNow, discard };
}
