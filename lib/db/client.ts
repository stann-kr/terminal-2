import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * Cloudflare Workers 환경에서 D1 데이터베이스 클라이언트를 반환함.
 * API Route 내에서 getRequestContext()로 획득한 env를 인자로 전달할 것.
 *
 * @example
 * import { getRequestContext } from '@cloudflare/next-on-pages';
 * const { env } = getRequestContext();
 * const db = getDb(env.DB);
 */
export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
