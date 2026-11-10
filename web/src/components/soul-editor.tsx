import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type TextareaHTMLAttributes } from 'react';
import { GripVertical } from 'lucide-react';
import type { Concept, Soul } from '../api';

/** 服务端也按这套上限拒收；这里照抄一份，写到边上就写不下去了。 */
const STATEMENT_MAX = 160;
const TERM_MAX = 40;
const DEFINITION_MAX = 400;

interface DragState {
  from: number;
  over: number;
  heights: number[];
}

/**
 * 拖一行时先只挪视觉：按每行实测高度算出该让出多少，松手才真正换序。
 * 换序放在松手那一刻，行还是原来那些节点，不会在拖动中途被 React 重挂载把拖拽打断。
 */
function useListDrag<T extends HTMLElement>(name: string, onMove: (from: number, to: number) => void) {
  const listRef = useRef<T>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const handleProps = (index: number) => ({
    'data-handle': `${name}-${index}`,
    draggable: true,
    onDragStart: (event: DragEvent<HTMLButtonElement>) => {
      event.dataTransfer.effectAllowed = 'move';
      const rows = Array.from(listRef.current?.children ?? []);
      setDrag({ from: index, over: index, heights: rows.map((row) => row.getBoundingClientRect().height) });
    },
    onDragEnd: () => setDrag(null),
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      onMove(index, event.key === 'ArrowUp' ? index - 1 : index + 1);
    },
  });

  const rowProps = (index: number) => ({
    onDragOver: (event: DragEvent<HTMLLIElement>) => {
      if (!drag) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      if (drag.over !== index) setDrag({ ...drag, over: index });
    },
    onDrop: (event: DragEvent<HTMLLIElement>) => {
      event.preventDefault();
      if (!drag) return;
      const { from, over } = drag;
      setDrag(null);
      onMove(from, over);
    },
    style: drag ? { transform: `translateY(${offsetOf(index, drag)}px)`, transition: 'transform 160ms ease' } : undefined,
  });

  return { listRef, drag, handleProps, rowProps };
}

/** 被拖的那行跟着手走，路过的行按它的高度整体让位。 */
function offsetOf(index: number, drag: DragState): number {
  const { from, over, heights } = drag;
  const dragged = heights[from] ?? 0;
  if (index === from) {
    const passed = from < over ? heights.slice(from + 1, over + 1) : heights.slice(over, from);
    const distance = passed.reduce((sum, height) => sum + height, 0);
    return from < over ? distance : -distance;
  }
  if (from < over && index > from && index <= over) return -dragged;
  if (over < from && index >= over && index < from) return dragged;
  return 0;
}

/**
 * 灵魂的写作面：一句话一行，每一行永远处在可编辑状态。
 * 回车另起一句，空行退格撤掉；左边抓手拖动换序，聚焦后按上下键也行。
 * 它只管草稿的内容，存不存、存到哪，由外面那层决定。
 */
export function SoulEditor({ value, onChange }: { value: Soul; onChange: (next: Soul) => void }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [focusRequest, setFocusRequest] = useState<string | null>(null);

  useEffect(() => {
    if (!focusRequest) return;
    const node = areaRef.current?.querySelector<HTMLElement>(focusRequest);
    node?.focus();
    if (node instanceof HTMLTextAreaElement) node.setSelectionRange(node.value.length, node.value.length);
    setFocusRequest(null);
  }, [focusRequest]);

  const setStatements = (statements: string[]) => onChange({ ...value, statements });

  const editStatement = (index: number, text: string) =>
    setStatements(value.statements.map((line, at) => (at === index ? text : line)));

  const insertStatement = (after: number) => {
    const next = [...value.statements];
    next.splice(after + 1, 0, '');
    setStatements(next);
    setFocusRequest(`[data-field="statement-${after + 1}"]`);
  };

  const removeStatement = (index: number) => setStatements(value.statements.filter((_, at) => at !== index));

  const moveStatement = (from: number, to: number) => {
    if (from === to || to < 0 || to >= value.statements.length) return;
    const next = [...value.statements];
    const [line] = next.splice(from, 1);
    next.splice(to, 0, line);
    setStatements(next);
  };

  const onStatementKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      insertStatement(index);
      return;
    }
    if (event.key === 'Backspace' && event.currentTarget.value === '' && value.statements.length > 1) {
      event.preventDefault();
      removeStatement(index);
      setFocusRequest(`[data-field="statement-${Math.max(0, index - 1)}"]`);
    }
  };

  const editConcept = (index: number, patch: Partial<Concept>) =>
    onChange({ ...value, concepts: value.concepts.map((item, at) => (at === index ? { ...item, ...patch } : item)) });

  const insertConcept = () => {
    onChange({ ...value, concepts: [...value.concepts, { term: '', definition: '' }] });
    setFocusRequest(`[data-field="concept-term-${value.concepts.length}"]`);
  };

  const removeConcept = (index: number) =>
    onChange({ ...value, concepts: value.concepts.filter((_, at) => at !== index) });

  const moveConcept = (from: number, to: number) => {
    if (from === to || to < 0 || to >= value.concepts.length) return;
    const next = [...value.concepts];
    const [concept] = next.splice(from, 1);
    next.splice(to, 0, concept);
    onChange({ ...value, concepts: next });
  };

  const statements = useListDrag<HTMLOListElement>('statement', (from, to) => {
    moveStatement(from, to);
    if (to >= 0 && to < value.statements.length) setFocusRequest(`[data-handle="statement-${to}"]`);
  });

  const concepts = useListDrag<HTMLUListElement>('concept', (from, to) => {
    moveConcept(from, to);
    if (to >= 0 && to < value.concepts.length) setFocusRequest(`[data-handle="concept-${to}"]`);
  });

  return (
    <div ref={areaRef} className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight">句子</h2>
          <span className="text-xs text-muted-foreground">一句话一条 · 顺序就是轻重</span>
        </div>

        {value.statements.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs leading-relaxed text-muted-foreground">
            还没有一句。它现在还没有形状。
          </p>
        ) : null}

        <ol ref={statements.listRef} className="flex flex-col">
          {value.statements.map((line, index) => (
            <li
              key={index}
              {...statements.rowProps(index)}
              className={`group flex items-start gap-1.5 rounded-lg border px-1.5 py-1.5 ${
                statements.drag?.from === index
                  ? 'border-border bg-muted/40 opacity-50'
                  : 'border-transparent hover:border-border'
              }`}
            >
              <button
                type="button"
                {...statements.handleProps(index)}
                aria-label={`第 ${index + 1} 句：拖动调整顺序，或按上下方向键`}
                className="mt-0.5 hidden size-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/40 transition hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:cursor-grabbing sm:flex"
              >
                <GripVertical aria-hidden className="size-3.5" />
              </button>
              <span className="mt-1 w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground/50 select-none">
                {String(index + 1).padStart(2, '0')}
              </span>
              <AutoTextarea
                data-field={`statement-${index}`}
                value={line}
                onChange={(next) => editStatement(index, next)}
                onKeyDown={(event) => onStatementKeyDown(event, index)}
                maxLength={STATEMENT_MAX}
                placeholder="写一句它不肯变成的东西…"
                className="flex-1 py-0.5 text-[0.95rem] leading-relaxed placeholder:text-muted-foreground/40"
              />
              <button
                type="button"
                onClick={() => removeStatement(index)}
                aria-label={`删掉第 ${index + 1} 句`}
                className="mt-1 shrink-0 rounded px-1 text-sm text-muted-foreground/40 opacity-40 transition group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
              >
                ×
              </button>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={() => insertStatement(value.statements.length - 1)}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
        >
          + 再写一句
        </button>
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight">名词</h2>
          <span className="text-xs text-muted-foreground">这一层里用的术语，以及它到底指什么</span>
        </div>

        {value.concepts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs leading-relaxed text-muted-foreground">
            还没有名词。它说的话，别人只能猜。
          </p>
        ) : null}

        <ul ref={concepts.listRef} className="flex flex-col">
          {value.concepts.map((concept, index) => (
            <li
              key={index}
              {...concepts.rowProps(index)}
              className={`group flex flex-col gap-1 rounded-lg border px-1.5 py-1.5 sm:flex-row sm:items-start sm:gap-2 ${
                concepts.drag?.from === index
                  ? 'border-border bg-muted/40 opacity-50'
                  : 'border-transparent hover:border-border'
              }`}
            >
              <button
                type="button"
                {...concepts.handleProps(index)}
                aria-label={`名词「${concept.term || index + 1}」：拖动调整顺序，或按上下方向键`}
                className="mt-0.5 hidden size-5 shrink-0 cursor-grab items-center justify-center self-start rounded text-muted-foreground/40 transition hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:cursor-grabbing sm:flex"
              >
                <GripVertical aria-hidden className="size-3.5" />
              </button>
              <AutoTextarea
                data-field={`concept-term-${index}`}
                value={concept.term}
                onChange={(next) => editConcept(index, { term: next })}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return;
                  event.preventDefault();
                  setFocusRequest(`[data-field="concept-definition-${index}"]`);
                }}
                maxLength={TERM_MAX}
                placeholder="术语"
                className="font-medium sm:w-44 sm:shrink-0"
              />
              <AutoTextarea
                data-field={`concept-definition-${index}`}
                value={concept.definition}
                onChange={(next) => editConcept(index, { definition: next })}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return;
                  event.preventDefault();
                  insertConcept();
                }}
                maxLength={DEFINITION_MAX}
                placeholder="它到底指什么"
                className="flex-1 text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => removeConcept(index)}
                aria-label={`删掉名词「${concept.term || index + 1}」`}
                className="shrink-0 self-start rounded px-1 text-sm text-muted-foreground/40 opacity-40 transition group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={insertConcept}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
        >
          + 再加一个名词
        </button>
      </section>
    </div>
  );
}

/** 一行就能开始写，写长了就自己长高，不出现内部滚动条。 */
function AutoTextarea({
  value,
  onChange,
  className = '',
  ...rest
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'rows'> & {
  value: string;
  onChange: (next: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      {...rest}
      ref={ref}
      rows={1}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`resize-none overflow-hidden bg-transparent text-sm leading-relaxed outline-none ${className}`}
    />
  );
}
