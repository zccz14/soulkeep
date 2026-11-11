import { fail } from './http';

const MAX = 200;

/** 公开访问地址：要么空，要么是 http(s) 开头、没有空白的地址。 */
export function normalizeUrl(value: unknown): string {
  if (typeof value !== 'string') return fail(400, 'bad_request', '公开访问地址必须是文字');
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length > MAX) return fail(400, 'bad_request', `公开访问地址最多 ${MAX} 个字`);
  if (!/^https?:\/\/[^\s]+$/i.test(trimmed)) {
    return fail(400, 'bad_request', '公开访问地址要 http:// 或 https:// 开头，且中间没有空白');
  }
  return trimmed;
}

/** Git 地址：要么空，要么一个没有空白的地址——https、ssh、`github.com/owner/repo` 简写都认。 */
export function normalizeRepo(value: unknown): string {
  if (typeof value !== 'string') return fail(400, 'bad_request', 'Git 地址必须是文字');
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length > MAX) return fail(400, 'bad_request', `Git 地址最多 ${MAX} 个字`);
  if (/\s/.test(trimmed)) return fail(400, 'bad_request', 'Git 地址里不能有空白');
  return trimmed;
}
