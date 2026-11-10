import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button, ErrorNote, Note } from '../ui';

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
 * 一份文档的编辑页外壳：吸顶的一条（返回 / 状态 / 保存），下面是标题与写作面。
 * 灵魂与骨架共用这一层，差别只在标题、说明和里面的编辑器。
 */
export function DocumentPage({
  slug,
  productName,
  title,
  hint,
  dirty,
  saving,
  restoredAt,
  savedAt,
  saveError,
  onSave,
  onDiscard,
  children,
}: {
  slug: string;
  productName: string;
  title: string;
  hint: string;
  dirty: boolean;
  saving: boolean;
  restoredAt: number | null;
  savedAt: number | null;
  saveError: unknown;
  onSave: () => void;
  onDiscard: () => void;
  children: ReactNode;
}) {
  return (
    <div className="-m-4 flex min-h-0 flex-1 flex-col md:-m-6">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3 md:px-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Link className="text-xs text-muted-foreground transition hover:text-foreground" to={`/p/${slug}`}>
                ← {productName}
              </Link>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-sm font-semibold">{title}</span>
              <span className="hidden flex-1 sm:block" />
              <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
                <span className="flex-1 text-xs text-muted-foreground sm:flex-none">
                  {statusOf(saving, dirty, savedAt)}
                </span>
                <Button variant="quiet" onClick={onDiscard} disabled={!dirty || saving}>
                  放弃修改
                </Button>
                <Button onClick={onSave} disabled={!dirty || saving}>
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
              <Button variant="quiet" onClick={onDiscard}>
                改用线上版本
              </Button>
            </div>
          ) : null}

          <header className="flex flex-col gap-1.5">
            <h1 className="text-xl font-semibold tracking-tight">
              {productName} · {title}
            </h1>
            <Note>{hint}</Note>
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}
