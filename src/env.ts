/** 绑定的运行时环境。除 DEV_USER_ID 外全部由 wrangler.jsonc 提供。 */
export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  AUTH_ISSUER: string;
  AUTH_AUDIENCE: string;
  APP_ORIGIN?: string;
  /** 仅本地开发：把身份固定成这个用户，生产环境永远不设置。 */
  DEV_USER_ID?: string;
}
