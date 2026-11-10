import { fail } from './http';

/** 灵魂是一份受 Schema 约束的 JSON：一句话一条，另有术语与它的定义。 */
export interface Concept {
  term: string;
  definition: string;
}

export interface Soul {
  version: 1;
  statements: string[];
  concepts: Concept[];
}

export const EMPTY_SOUL: Soul = { version: 1, statements: [], concepts: [] };

const MAX_STATEMENTS = 500;
const MAX_STATEMENT_LENGTH = 160;
const MAX_CONCEPTS = 200;
const MAX_TERM_LENGTH = 40;
const MAX_DEFINITION_LENGTH = 400;

export function parseSoul(json: string): Soul {
  return normalizeSoul(JSON.parse(json));
}

/** 只认一种形状：version 1 + 短句 + 术语/定义。别的都当场拒掉，不猜。 */
export function normalizeSoul(input: unknown): Soul {
  const document = (input ?? {}) as { version?: unknown; statements?: unknown; concepts?: unknown };
  if (document.version !== undefined && document.version !== 1) {
    return fail(400, 'bad_request', `灵魂的 version 只认 1，收到 ${String(document.version)}`);
  }
  return { version: 1, statements: statementsOf(document.statements), concepts: conceptsOf(document.concepts) };
}

function statementsOf(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return fail(400, 'bad_request', '灵魂的 statements 必须是数组');
  const lines = value
    .map((line) => {
      if (typeof line !== 'string') return fail(400, 'bad_request', '灵魂的每一条都必须是文字');
      const trimmed = line.trim();
      if (trimmed.length > MAX_STATEMENT_LENGTH) {
        return fail(400, 'bad_request', `每一条最多 ${MAX_STATEMENT_LENGTH} 个字`);
      }
      return trimmed;
    })
    .filter(Boolean);
  if (lines.length > MAX_STATEMENTS) return fail(400, 'bad_request', `最多 ${MAX_STATEMENTS} 条`);
  return lines;
}

function conceptsOf(value: unknown): Concept[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return fail(400, 'bad_request', '灵魂的 concepts 必须是数组');
  const items = value.map((item) => {
    const concept = (item ?? {}) as { term?: unknown; definition?: unknown };
    return {
      term: textOf(concept.term, MAX_TERM_LENGTH, '概念的名字'),
      definition: textOf(concept.definition, MAX_DEFINITION_LENGTH, '概念的定义'),
    };
  });
  if (items.length > MAX_CONCEPTS) return fail(400, 'bad_request', `最多 ${MAX_CONCEPTS} 个概念`);
  return items;
}

function textOf(value: unknown, max: number, what: string): string {
  if (typeof value !== 'string') return fail(400, 'bad_request', `${what}必须是文字`);
  const trimmed = value.trim();
  if (!trimmed) return fail(400, 'bad_request', `${what}不能为空`);
  if (trimmed.length > max) return fail(400, 'bad_request', `${what}最多 ${max} 个字`);
  return trimmed;
}
