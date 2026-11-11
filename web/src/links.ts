/** 地址的显示与跳转：存的是原文，显示时把协议与前缀收掉。 */

export function hostOf(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

/** http(s)、`git@host:owner/repo.git`、`github.com/owner/repo` 三种写法都指向同一个页面。 */
export function repoHref(repo: string): string {
  const ssh = /^git@([^:]+):(.+)$/.exec(repo);
  if (ssh) return `https://${ssh[1]}/${ssh[2].replace(/\.git$/, '')}`;
  if (/^https?:\/\//i.test(repo)) return repo.replace(/\.git$/, '');
  return `https://${repo.replace(/\.git$/, '')}`;
}

export function repoLabel(repo: string): string {
  return repoHref(repo).replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}
