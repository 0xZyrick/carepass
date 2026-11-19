import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "./db";

/** Money on each pass that is locked on the network for care-plan steps that haven't been released yet. */
export async function lockedByPass(passIds: string[]): Promise<Map<string, number>> {
  if (!passIds.length) return new Map();
  const rows = await db
    .select({ passId: schema.carePlan.passId, cents: sql<number>`coalesce(sum(${schema.careStep.priceCents}), 0)::int` })
    .from(schema.careStep)
    .innerJoin(schema.carePlan, eq(schema.carePlan.id, schema.careStep.planId))
    .where(and(inArray(schema.carePlan.passId, passIds), eq(schema.carePlan.status, "active"), eq(schema.careStep.status, "pending"), sql`${schema.carePlan.chainPlanId} is not null`))
    .groupBy(schema.carePlan.passId);
  return new Map(rows.map((r) => [r.passId, Number(r.cents)]));
}
export const lockedCents = async (passId: string) => (await lockedByPass([passId])).get(passId) ?? 0;
