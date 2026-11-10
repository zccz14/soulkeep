import type { Soul } from './api';

/**
 * 空行不是一句，半个名词也不是一个名词。
 * 存之前统一收拾干净：比对有没有改动、写给服务端、存本地草稿，用的都是这一份。
 */
export function cleanSoul(soul: Soul): Soul {
  return {
    version: 1,
    statements: soul.statements.map((line) => line.trim()).filter(Boolean),
    concepts: soul.concepts
      .map((concept) => ({ term: concept.term.trim(), definition: concept.definition.trim() }))
      .filter((concept) => concept.term || concept.definition),
  };
}

export function sameSoul(left: Soul, right: Soul): boolean {
  return JSON.stringify(cleanSoul(left)) === JSON.stringify(cleanSoul(right));
}
