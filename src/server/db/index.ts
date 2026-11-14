import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { neon } from "@neondatabase/serverless";
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import * as schema from "./schema";

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

const g = globalThis as unknown as { __cpDb?: { db: DB; kind: "neon" | "pglite" } };

function create() {
  const url = process.env.DATABASE_URL;
  if (url) return { db: drizzleNeon(neon(url), { schema }) as unknown as DB, kind: "neon" as const };
  // No DATABASE_URL: embedded Postgres (PGlite) held IN MEMORY, so data resets when the server restarts.
  // It is meant for trying the app and for tests. PGlite's on-disk mode is not crash-safe (a killed server
  // can lose recent writes or leave the folder unreadable), so it is opt-in: set PGLITE_DIR to use it.
  const dir = process.env.PGLITE_DIR;
  if (dir) fs.mkdirSync(dir, { recursive: true });
  const client = dir ? new PGlite(dir) : new PGlite();
  return { db: drizzlePglite(client, { schema }) as unknown as DB, kind: "pglite" as const };
}

const inst = (g.__cpDb ??= create());
export const db = inst.db;
export const dbKind = inst.kind;
export { schema };
