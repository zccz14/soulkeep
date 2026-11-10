import { useRef } from 'react';

let seed = 0;
const nextRowId = (prefix: string) => `${prefix}-${++seed}`;

/**
 * 文档里的行没有 id（它就是一段文字），但拖拽库要靠稳定的 key 认出「同一行」。
 * 这份 id 只活在这次编辑里：插入、删除、换序都跟着内容一起搬，不写进文档。
 */
export function useRowIds(prefix: string, count: number) {
  const ids = useRef<string[]>([]);
  if (ids.current.length !== count) {
    const next = ids.current.slice(0, count);
    while (next.length < count) next.push(nextRowId(prefix));
    ids.current = next;
  }
  return {
    ids: ids.current,
    insert: (at: number) => ids.current.splice(at, 0, nextRowId(prefix)),
    remove: (at: number) => ids.current.splice(at, 1),
    move: (from: number, to: number) => {
      const [id] = ids.current.splice(from, 1);
      ids.current.splice(to, 0, id);
    },
  };
}
