import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { DragDropProvider, PointerSensor } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { GripVertical } from 'lucide-react';
import type { Cardinality, Skeleton, SkeletonRelation, SkeletonTable } from '../api';
import { useRowIds } from '../row-ids';
import { CARDINALITIES, CARDINALITY_LABEL } from '../skeleton';
import { Select } from '../ui';

const TRANSITION = { duration: 200, idle: true };

/**
 * 骨架的写作面：先只做 ER——表是一行名字，关系是一行「谁 —基数→ 谁」。
 * 不写字段：字段属于血肉，写进这里就变成另一种东西了。
 */
export function SkeletonEditor({ value, onChange }: { value: Skeleton; onChange: (next: Skeleton) => void }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [focusRequest, setFocusRequest] = useState<string | null>(null);
  const tableIds = useRowIds('table', value.tables.length);
  const relationIds = useRowIds('relation', value.relations.length);

  useEffect(() => {
    if (!focusRequest) return;
    areaRef.current?.querySelector<HTMLElement>(focusRequest)?.focus();
    setFocusRequest(null);
  }, [focusRequest]);

  const editTable = (index: number, patch: Partial<SkeletonTable>) =>
    onChange({ ...value, tables: value.tables.map((table, at) => (at === index ? { ...table, ...patch } : table)) });

  /** 改表名时，挂在它上面的关系一起改——否则关系会指向一张已经不存在的表。 */
  const renameTable = (index: number, name: string) => {
    const previous = value.tables[index].name;
    onChange({
      ...value,
      tables: value.tables.map((table, at) => (at === index ? { ...table, name } : table)),
      relations: value.relations.map((relation) => ({
        ...relation,
        from: relation.from === previous ? name : relation.from,
        to: relation.to === previous ? name : relation.to,
      })),
    });
  };

  const insertTable = () => {
    tableIds.insert(value.tables.length);
    onChange({ ...value, tables: [...value.tables, { name: '', note: '' }] });
    setFocusRequest(`[data-field="table-name-${value.tables.length}"]`);
  };

  const removeTable = (index: number) => {
    const removed = value.tables[index].name;
    tableIds.remove(index);
    onChange({
      ...value,
      tables: value.tables.filter((_, at) => at !== index),
      relations: value.relations.filter((relation) => relation.from !== removed && relation.to !== removed),
    });
  };

  const moveTable = (from: number, to: number) => {
    if (from === to || to < 0 || to >= value.tables.length) return;
    tableIds.move(from, to);
    const next = [...value.tables];
    const [table] = next.splice(from, 1);
    next.splice(to, 0, table);
    onChange({ ...value, tables: next });
  };

  const editRelation = (index: number, patch: Partial<SkeletonRelation>) =>
    onChange({
      ...value,
      relations: value.relations.map((relation, at) => (at === index ? { ...relation, ...patch } : relation)),
    });

  const insertRelation = () => {
    const [first, second] = value.tables.map((table) => table.name);
    relationIds.insert(value.relations.length);
    onChange({
      ...value,
      relations: [...value.relations, { from: first, to: second ?? first, cardinality: 'one-to-many' }],
    });
  };

  const removeRelation = (index: number) => {
    relationIds.remove(index);
    onChange({ ...value, relations: value.relations.filter((_, at) => at !== index) });
  };

  const moveRelation = (from: number, to: number) => {
    if (from === to || to < 0 || to >= value.relations.length) return;
    relationIds.move(from, to);
    const next = [...value.relations];
    const [relation] = next.splice(from, 1);
    next.splice(to, 0, relation);
    onChange({ ...value, relations: next });
  };

  const moveByKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    move: (from: number, to: number) => void,
    index: number,
    name: string,
  ) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const to = event.key === 'ArrowUp' ? index - 1 : index + 1;
    move(index, to);
    setFocusRequest(`[data-handle="${name}-${to}"]`);
  };

  return (
    <DragDropProvider
      sensors={[PointerSensor]}
      onDragEnd={(event) => {
        if (event.canceled) return;
        const source = event.operation.source;
        if (!source || !isSortable(source)) return;
        const { initialIndex, index } = source;
        if (initialIndex === index) return;
        if (source.group === 'tables') moveTable(initialIndex, index);
        else moveRelation(initialIndex, index);
      }}
    >
      <div ref={areaRef} className="flex flex-col gap-8">
        <section className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight">表</h2>
            <span className="text-xs text-muted-foreground">有哪些实体 · 不写字段</span>
          </div>

          {value.tables.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs leading-relaxed text-muted-foreground">
              还没有表。它现在还没有数据形状。
            </p>
          ) : null}

          <ol className="flex flex-col">
            {value.tables.map((table, index) => (
              <TableRow
                id={tableIds.ids[index]}
                index={index}
                key={tableIds.ids[index]}
                onHandleKeyDown={(event) => moveByKeyboard(event, moveTable, index, 'table')}
                onName={(name) => renameTable(index, name)}
                onNote={(note) => editTable(index, { note })}
                onRemove={() => removeTable(index)}
                table={table}
              />
            ))}
          </ol>

          <button
            type="button"
            onClick={insertTable}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
          >
            + 再加一张表
          </button>
        </section>

        <section className="flex flex-col gap-2 border-t border-border pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight">关系</h2>
            <span className="text-xs text-muted-foreground">谁和谁怎么连 · 一对一 / 一对多 / 多对多</span>
          </div>

          {value.relations.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs leading-relaxed text-muted-foreground">
              还没有关系。表还是各活各的。
            </p>
          ) : null}

          <ul className="flex flex-col">
            {value.relations.map((relation, index) => (
              <RelationRow
                id={relationIds.ids[index]}
                index={index}
                key={relationIds.ids[index]}
                onEdit={(patch) => editRelation(index, patch)}
                onHandleKeyDown={(event) => moveByKeyboard(event, moveRelation, index, 'relation')}
                onRemove={() => removeRelation(index)}
                relation={relation}
                tables={value.tables}
              />
            ))}
          </ul>

          <button
            type="button"
            disabled={value.tables.length === 0}
            onClick={insertRelation}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-muted-foreground"
          >
            + 再加一条关系
          </button>
          {value.tables.length === 0 ? (
            <p className="text-xs text-muted-foreground">先有表，才有关系。</p>
          ) : null}
        </section>
      </div>
    </DragDropProvider>
  );
}

function TableRow({
  id,
  index,
  table,
  onName,
  onNote,
  onHandleKeyDown,
  onRemove,
}: {
  id: string;
  index: number;
  table: SkeletonTable;
  onName: (name: string) => void;
  onNote: (note: string) => void;
  onHandleKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onRemove: () => void;
}) {
  const { ref, handleRef } = useSortable({ id, index, group: 'tables', transition: TRANSITION });

  return (
    <li
      ref={ref}
      className="group flex items-start gap-1.5 rounded-lg border border-transparent px-1.5 py-1 hover:border-border"
    >
      <button
        ref={handleRef}
        type="button"
        data-handle={`table-${index}`}
        aria-label={`表「${table.name || index + 1}」：拖动调整顺序，或按上下方向键`}
        onKeyDown={onHandleKeyDown}
        className="mt-0.5 hidden size-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/40 transition hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:cursor-grabbing sm:flex"
      >
        <GripVertical aria-hidden className="size-3.5" />
      </button>
      <input
        data-field={`table-name-${index}`}
        value={table.name}
        onChange={(event) => onName(event.target.value)}
        maxLength={60}
        placeholder="表名，例如 products"
        className="mt-0.5 w-40 shrink-0 rounded bg-transparent px-1 py-0.5 text-sm font-medium outline-none placeholder:text-muted-foreground/40"
      />
      <input
        value={table.note}
        onChange={(event) => onNote(event.target.value)}
        maxLength={240}
        placeholder="这张表是什么"
        className="mt-0.5 min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/40"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`删掉表「${table.name || index + 1}」`}
        className="mt-0.5 shrink-0 rounded px-1 text-sm text-muted-foreground/40 opacity-40 transition group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
      >
        ×
      </button>
    </li>
  );
}

function RelationRow({
  id,
  index,
  relation,
  tables,
  onEdit,
  onHandleKeyDown,
  onRemove,
}: {
  id: string;
  index: number;
  relation: SkeletonRelation;
  tables: SkeletonTable[];
  onEdit: (patch: Partial<SkeletonRelation>) => void;
  onHandleKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onRemove: () => void;
}) {
  const { ref, handleRef } = useSortable({ id, index, group: 'relations', transition: TRANSITION });

  return (
    <li
      ref={ref}
      className="group flex flex-wrap items-center gap-1.5 rounded-lg border border-transparent px-1.5 py-1 hover:border-border"
    >
      <button
        ref={handleRef}
        type="button"
        data-handle={`relation-${index}`}
        aria-label={`第 ${index + 1} 条关系：拖动调整顺序，或按上下方向键`}
        onKeyDown={onHandleKeyDown}
        className="hidden size-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/40 transition hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:cursor-grabbing sm:flex"
      >
        <GripVertical aria-hidden className="size-3.5" />
      </button>
      <span className="w-36 shrink-0">
        <Select value={relation.from} onChange={(event) => onEdit({ from: event.target.value })}>
          {tables.map((table) => (
            <option key={table.name} value={table.name}>
              {table.name || '（还没起名）'}
            </option>
          ))}
        </Select>
      </span>
      <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-border p-0.5">
        {CARDINALITIES.map((cardinality: Cardinality) => (
          <button
            key={cardinality}
            type="button"
            onClick={() => onEdit({ cardinality })}
            className={`rounded px-1.5 py-0.5 text-[0.7rem] transition ${
              relation.cardinality === cardinality
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {CARDINALITY_LABEL[cardinality]}
          </button>
        ))}
      </div>
      <span className="w-36 shrink-0">
        <Select value={relation.to} onChange={(event) => onEdit({ to: event.target.value })}>
          {tables.map((table) => (
            <option key={table.name} value={table.name}>
              {table.name || '（还没起名）'}
            </option>
          ))}
        </Select>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`删掉第 ${index + 1} 条关系`}
        className="shrink-0 rounded px-1 text-sm text-muted-foreground/40 opacity-40 transition group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
      >
        ×
      </button>
    </li>
  );
}
