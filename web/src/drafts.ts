import type { Skeleton, Soul } from './api';

export type DocumentKind = 'soul' | 'skeleton';

export type DocumentOf<K extends DocumentKind> = K extends 'soul' ? Soul : Skeleton;

export interface LocalDraft<T> {
  at: number;
  document: T;
}

const keyOf = (kind: DocumentKind, slug: string) => `soulkeep.${kind}-draft.${slug}`;

export function readDraft<T>(kind: DocumentKind, slug: string): LocalDraft<T> | null {
  const raw = window.localStorage.getItem(keyOf(kind, slug));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LocalDraft<T>>;
    if (typeof parsed.at !== 'number' || !parsed.document) return null;
    return { at: parsed.at, document: parsed.document };
  } catch {
    // RECOVERY: 坏掉的本地草稿只当没有；线上那份才是真的，别让它挡住编辑器。
    return null;
  }
}

export function writeDraft<T>(kind: DocumentKind, slug: string, document: T) {
  window.localStorage.setItem(keyOf(kind, slug), JSON.stringify({ at: Date.now(), document } satisfies LocalDraft<T>));
}

export function clearDraft(kind: DocumentKind, slug: string) {
  window.localStorage.removeItem(keyOf(kind, slug));
}
