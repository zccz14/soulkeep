import { fail } from './http';

/** 灵魂是一份受 Schema 约束的 JSON：一句话一条，顺序就是次序。 */
export interface Soul {
  version: 1;
  statements: string[];
}

export const EMPTY_SOUL: Soul = { version: 1, statements: [] };

const MAX_STATEMENTS = 500;
const MAX_LENGTH = 160;

export function parseSoul(json: string): Soul {
  return normalizeSoul(JSON.parse(json));
}

/** 只认一种形状：version 1 + 非空短句组成的数组。别的都当场拒掉，不猜。 */
export function normalizeSoul(input: unknown): Soul {
  const document = (input ?? {}) as { version?: unknown; statements?: unknown };
  if (document.version !== undefined && document.version !== 1) {
    return fail(400, 'bad_request', `灵魂的 version 只认 1，收到 ${String(document.version)}`);
  }
  const lines = document.statements ?? [];
  if (!Array.isArray(lines)) return fail(400, 'bad_request', '灵魂的 statements 必须是数组');
  const statements = lines.map((line) => {
    if (typeof line !== 'string') return fail(400, 'bad_request', '灵魂的每一条都必须是文字');
    const trimmed = line.trim();
    if (trimmed.length > MAX_LENGTH) return fail(400, 'bad_request', `每一条最多 ${MAX_LENGTH} 个字`);
    return trimmed;
  });
  const kept = statements.filter(Boolean);
  if (kept.length > MAX_STATEMENTS) return fail(400, 'bad_request', `最多 ${MAX_STATEMENTS} 条`);
  return { version: 1, statements: kept };
}
