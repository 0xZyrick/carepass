// Applies ./drizzle/*.sql to the database in DATABASE_URL (Neon), or to local PGlite if unset.
import path from "node:path";
import { db, dbKind } from "../src/server/db/index";

const migrationsFolder = path.join(process.cwd(), "drizzle");
if (dbKind === "neon") {
  const { migrate } = await import("drizzle-orm/neon-http/migrator");
  await migrate(db as never, { migrationsFolder });
} else {
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  await migrate(db as never, { migrationsFolder });
}
console.log(`✓ ${dbKind} database migrated`);
process.exit(0);
