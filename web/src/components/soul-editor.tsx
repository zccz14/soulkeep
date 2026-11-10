import { useEffect, useRef, useState, type KeyboardEvent, type TextareaHTMLAttributes } from 'react';
import type { Concept, Soul } from '../api';

/** 服务端也按这套上限拒收；这里照抄一份，写到边上就写不下去了。 */
const STATEMENT_MAX = 160;
const TERM_MAX = 40;
const DEFINITION_MAX = 400;

/**
 * 灵魂的写作面：一句话一行，每一行永远处在可编辑状态。
 * 回车另起一句，空行退格撤掉；左边编号既是顺序，也是拖拽把手。
 * 它只管草稿的内容，存不存、存到哪，由外面那层决定。
 */
export function SoulEditor({ value, onChange }: { value: Soul; onChange: (next: Soul) => void }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [focusField, setFocusField] = useState<string | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  useEffect(() => {
    if (!focusField) return;
    const node = areaRef.current?.querySelector<HTMLTextAreaElement>(`[data-field="${focusField}"]`);
    node?.focus();
    node?.setSelectionRange(node.value.length, node.value.length);
    setFocusField(null);
  }, [focusField]);

  const setStatements = (statements: string[]) => onChange({ ...value, statements });

  const editStatement = (index: number, text: string) =>
    setStatements(value.statements.map((line, at) => (at === index ? text : line)));

  const insertStatement = (after: number) => {
    const next = [...value.statements];
    next.splice(after + 1, 0, '');
    setStatements(next);
    setFocusField(`statement-${after + 1}`);
  };

  const removeStatement = (index: number) => setStatements(value.statements.filter((_, at) => at !== index));

  const moveStatement = (from: number, to: number) => {
    if (to < 0 || to >= value.statements.length || to === from) return;
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
      setFocusField(`statement-${Math.max(0, index - 1)}`);
    }
  };

  const editConcept = (index: number, patch: Partial<Concept>) =>
    onChange({ ...value, concepts: value.concepts.map((item, at) => (at === index ? { ...item, ...patch } : item)) });

  const insertConcept = () => {
    onChange({ ...value, concepts: [...value.concepts, { term: '', definition: '' }] });
    setFocusField(`concept-term-${value.concepts.length}`);
  };

  const removeConcept = (index: number) =>
    onChange({ ...value, concepts: value.concepts.filter((_, at) => at !== index) });

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

        <ol className="flex flex-col">
          {value.statements.map((line, index) => (
            <li
              key={index}
              onDragOver={(event) => {
                if (dragging === null || dragging === index) return;
                event.preventDefault();
                setOver(index);
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragging === null) return;
                moveStatement(dragging, index);
                setDragging(null);
                setOver(null);
              }}
              className={`group flex items-start gap-2 rounded-lg border px-2 py-1.5 transition ${
                dragging === index
                  ? 'border-border opacity-40'
                  : over === index && dragging !== null
                    ? 'border-foreground/40 bg-foreground/[0.04]'
                    : 'border-transparent hover:border-border'
              }`}
            >
              <button
                type="button"
                draggable
                aria-label={`第 ${index + 1} 句：拖动调整顺序，或按上下方向键`}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  setDragging(index);
                }}
                onDragEnd={() => {
                  setDragging(null);
                  setOver(null);
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
                  event.preventDefault();
                  const to = event.key === 'ArrowUp' ? index - 1 : index + 1;
                  moveStatement(index, to);
                  if (to >= 0 && to < value.statements.length) setFocusField(`statement-${to}`);
                }}
                className="mt-1 w-6 shrink-0 cursor-grab rounded text-right text-xs tabular-nums text-muted-foreground/50 transition select-none hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:cursor-grabbing"
              >
                {String(index + 1).padStart(2, '0')}
              </button>
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

        <ul className="flex flex-col">
          {value.concepts.map((concept, index) => (
            <li
              key={index}
              className="group flex flex-col gap-1 rounded-lg border border-transparent px-2 py-1.5 transition hover:border-border sm:flex-row sm:items-start sm:gap-3"
            >
              <AutoTextarea
                data-field={`concept-term-${index}`}
                value={concept.term}
                onChange={(next) => editConcept(index, { term: next })}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return;
                  event.preventDefault();
                  setFocusField(`concept-definition-${index}`);
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
                className="shrink-0 rounded px-1 text-sm text-muted-foreground/40 opacity-40 transition group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
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
