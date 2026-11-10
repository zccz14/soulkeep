import type { Soul } from './api';

export interface LocalDraft {
  at: number;
  soul: Soul;
}

const keyOf = (slug: string) => `soulkeep.soul-draft.${slug}`;

export function readDraft(slug: string): LocalDraft | null {
  const raw = window.localStorage.getItem(keyOf(slug));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LocalDraft>;
    if (typeof parsed.at !== 'number' || !parsed.soul) return null;
    return { at: parsed.at, soul: parsed.soul };
  } catch {
    // RECOVERY: 坏掉的本地草稿只当没有；线上那份才是真的，别让它挡住编辑器。
    return null;
  }
}

export function writeDraft(slug: string, soul: Soul) {
  window.localStorage.setItem(keyOf(slug), JSON.stringify({ at: Date.now(), soul } satisfies LocalDraft));
}

export function clearDraft(slug: string) {
  window.localStorage.removeItem(keyOf(slug));
}
