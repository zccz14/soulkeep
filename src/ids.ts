export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

/** slug 只留小写字母、数字和连字符；中文名由创始人另外填。 */
export function toSlug(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return slug || `p-${crypto.randomUUID().slice(0, 8)}`;
}
