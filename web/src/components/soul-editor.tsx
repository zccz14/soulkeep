import { useRef, useState } from 'react';
import type { Soul } from '../api';
import { Button, Empty, Field, TextInput } from '../ui';

/**
 * 灵魂文档的编辑面：只改草稿，不碰接口。
 * 保存、放弃、有没有改动，都由外面那层决定。
 */
export function SoulEditor({
  value,
  editable,
  onChange,
}: {
  value: Soul;
  editable: boolean;
  onChange: (next: Soul) => void;
}) {
  const [statement, setStatement] = useState('');
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [editingConcept, setEditingConcept] = useState<number | null>(null);
  const [draftTerm, setDraftTerm] = useState('');
  const [draftDefinition, setDraftDefinition] = useState('');
  /** 正在改哪一条：Enter、失焦、Esc 谁先来都只算一次。 */
  const editingAt = useRef<number | null>(null);
  const editingConceptAt = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const addStatement = () => {
    const next = statement.trim();
    if (!next) return;
    setStatement('');
    onChange({ ...value, statements: [...value.statements, next] });
  };

  const startEdit = (index: number) => {
    editingAt.current = index;
    setDraft(value.statements[index]);
    setEditing(index);
  };

  const stopEdit = () => {
    editingAt.current = null;
    setEditing(null);
  };

  const commit = (index: number) => {
    if (editingAt.current !== index) return;
    const next = draft.trim();
    stopEdit();
    if (!next || next === value.statements[index]) return;
    onChange({ ...value, statements: value.statements.map((line, at) => (at === index ? next : line)) });
  };

  const dropOn = (target: number) => {
    const from = dragging;
    setDragging(null);
    setOver(null);
    if (from === null || from === target) return;
    const rest = value.statements.filter((_, at) => at !== from);
    rest.splice(target, 0, value.statements[from]);
    onChange({ ...value, statements: rest });
  };

  const startConcept = (index: number) => {
    editingConceptAt.current = index;
    setDraftTerm(value.concepts[index].term);
    setDraftDefinition(value.concepts[index].definition);
    setEditingConcept(index);
  };

  const stopConcept = () => {
    editingConceptAt.current = null;
    setEditingConcept(null);
  };

  const commitConcept = (index: number) => {
    if (editingConceptAt.current !== index) return;
    const nextTerm = draftTerm.trim();
    const nextDefinition = draftDefinition.trim();
    stopConcept();
    if (!nextTerm || !nextDefinition) return;
    const current = value.concepts[index];
    if (nextTerm === current.term && nextDefinition === current.definition) return;
    onChange({
      ...value,
      concepts: value.concepts.map((item, at) => (at === index ? { term: nextTerm, definition: nextDefinition } : item)),
    });
  };

  const addConcept = () => {
    const nextTerm = term.trim();
    const nextDefinition = definition.trim();
    if (!nextTerm || !nextDefinition) return;
    setTerm('');
    setDefinition('');
    onChange({ ...value, concepts: [...value.concepts, { term: nextTerm, definition: nextDefinition }] });
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1.5">
        {value.statements.length === 0 ? <Empty>还没有一句。它现在还没有形状。</Empty> : null}
        {value.statements.map((line, index) => (
          <li
            key={index}
            draggable={editable && editing !== index}
            onDragStart={() => setDragging(index)}
            onDragEnd={() => {
              setDragging(null);
              setOver(null);
            }}
            onDragOver={(event) => {
              if (dragging === null || dragging === index) return;
              event.preventDefault();
              setOver(index);
            }}
            onDrop={(event) => {
              event.preventDefault();
              dropOn(index);
            }}
            className={`flex items-start gap-2 rounded-md border px-2.5 py-2 text-xs leading-relaxed transition ${
              dragging === index
                ? 'border-border opacity-40'
                : over === index && dragging !== null
                  ? 'border-foreground/50 bg-foreground/[0.05]'
                  : 'border-border'
            } ${editable && editing !== index ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            {editable ? (
              <span aria-hidden className="mt-0.5 shrink-0 select-none px-0.5 text-sm leading-4 text-muted-foreground/50">
                ⋮
              </span>
            ) : null}
            {editing === index ? (
              <input
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commit(index);
                  if (event.key === 'Escape') stopEdit();
                }}
                onBlur={() => commit(index)}
                className="min-w-0 flex-1 rounded border border-input bg-background px-1.5 py-0.5 text-xs outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-ring/20"
              />
            ) : (
              <span
                onClick={editable ? () => startEdit(index) : undefined}
                className={`flex-1 ${editable ? '-mx-1 cursor-text rounded px-1 transition hover:bg-foreground/[0.04]' : ''}`}
              >
                {line}
              </span>
            )}
            {editable && editing !== index ? (
              <button
                type="button"
                onClick={() => onChange({ ...value, statements: value.statements.filter((_, at) => at !== index) })}
                className="shrink-0 text-muted-foreground transition hover:text-destructive"
                aria-label="拿掉这一句"
              >
                ×
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {editable ? (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <Field label="再加一句">
            <TextInput
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') addStatement();
              }}
              placeholder="例如：绝不替创始人做身份决定。"
            />
          </Field>
          <Button onClick={addStatement} disabled={!statement.trim()}>
            加进草稿
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">名词：这一层里用的术语，以及它到底指什么。</p>
        <ul className="flex flex-col gap-1.5">
          {value.concepts.length === 0 ? <Empty>还没有名词。它说的话，别人只能猜。</Empty> : null}
          {value.concepts.map((concept, index) => (
            <li key={index} className="rounded-md border border-border px-2.5 py-2 text-xs leading-relaxed">
              {editingConcept === index ? (
                <div
                  className="flex flex-col gap-1.5"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) commitConcept(index);
                  }}
                >
                  <input
                    autoFocus
                    value={draftTerm}
                    onChange={(event) => setDraftTerm(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitConcept(index);
                      if (event.key === 'Escape') stopConcept();
                    }}
                    placeholder="术语"
                    className="rounded border border-input bg-background px-1.5 py-0.5 text-xs font-medium outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-ring/20"
                  />
                  <input
                    value={draftDefinition}
                    onChange={(event) => setDraftDefinition(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitConcept(index);
                      if (event.key === 'Escape') stopConcept();
                    }}
                    placeholder="定义"
                    className="rounded border border-input bg-background px-1.5 py-0.5 text-xs outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              ) : (
                <div
                  onClick={editable ? () => startConcept(index) : undefined}
                  className={editable ? '-mx-1 cursor-text rounded px-1 transition hover:bg-foreground/[0.04]' : ''}
                >
                  <span className="font-medium">{concept.term}</span>
                  <span className="ml-2 text-muted-foreground">{concept.definition}</span>
                </div>
              )}
              {editable && editingConcept !== index ? (
                <button
                  type="button"
                  onClick={() => onChange({ ...value, concepts: value.concepts.filter((_, at) => at !== index) })}
                  className="mt-1 text-muted-foreground transition hover:text-destructive"
                  aria-label="删掉这个名词"
                >
                  ×
                </button>
              ) : null}
            </li>
          ))}
        </ul>

        {editable ? (
          <div className="flex flex-col gap-2">
            <Field label="术语">
              <TextInput value={term} onChange={(event) => setTerm(event.target.value)} placeholder="例如：骨架" />
            </Field>
            <Field label="定义">
              <TextInput
                value={definition}
                onChange={(event) => setDefinition(event.target.value)}
                placeholder="例如：概念、术语、关系；小到一个人一小时读完。"
              />
            </Field>
            <Button onClick={addConcept} disabled={!term.trim() || !definition.trim()}>
              记进草稿
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
