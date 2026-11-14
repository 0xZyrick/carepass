import path from "node:path";
import { db, dbKind } from "./server/db";

/** Local dev/test only: migrate the embedded PGlite database on server start.
 *  Neon is migrated explicitly with `npm run db:migrate` (scripts/migrate.mts). */
export async function migrateLocal() {
  if (dbKind !== "pglite") return;
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  await migrate(db as never, { migrationsFolder: path.join(process.cwd(), "drizzle") });
}
