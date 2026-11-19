import "server-only";
import crypto from "node:crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, getOwnedPass, schema, uid } from "./passes";
import { PACKAGES, packageById } from "@/lib/care";
import type { Me } from "./auth";
import { payClinic } from "./payments";
import { CONTRACT_REASON, ChainError, cancelPlanOnChain, escrowOn, openPlanOnChain } from "./chain";
import type { ClinicRow } from "./clinics";

const key = () => crypto.createHash("sha256").update("visit-code:" + (process.env.BETTER_AUTH_SECRET ?? "carepass-dev-only-secret-change-me-in-production")).digest();
/** The 6-digit code a family shows at the visit. Derived from the step, so nothing sensitive is stored. */
export const visitCode = (stepId: string) => {
  const n = crypto.createHmac("sha256", key()).update(stepId).digest().readUInt32BE(0) % 1_000_000;
  return String(n).padStart(6, "0");
};

type Step = typeof schema.careStep.$inferSelect;
const stepView = (s: Step, clinicName: string, when: string) => ({
  id: s.id, idx: s.idx, title: s.title, category: s.category, priceUsd: s.priceCents / 100, when,
  clinicId: s.clinicId, clinicName, status: s.status as "pending" | "done", doneAt: s.doneAt?.toISOString() ?? null, receiptId: s.ledgerId,
});

export async function plansForPasses(passIds: string[]) {
  if (!passIds.length) return [];
  const plans = await db.select().from(schema.carePlan).where(and(inArray(schema.carePlan.passId, passIds))).orderBy(desc(schema.carePlan.createdAt));
  if (!plans.length) return [];
  const steps = await db.select().from(schema.careStep).where(inArray(schema.careStep.planId, plans.map((p) => p.id))).orderBy(asc(schema.careStep.idx));
  const clinics = await db.select({ id: schema.clinic.id, name: schema.clinic.name }).from(schema.clinic).where(inArray(schema.clinic.id, [...new Set(steps.map((s) => s.clinicId))]));
  const names = new Map(clinics.map((c) => [c.id, c.name]));
  return plans.map((p) => {
    const pkg = packageById(p.packageId);
    const mine = steps.filter((s) => s.planId === p.id).map((s) => stepView(s, names.get(s.clinicId) ?? "Provider", pkg?.steps[s.idx]?.when ?? ""));
    const next = mine.find((s) => s.status === "pending");
    return {
      id: p.id, passId: p.passId, packageId: p.packageId, title: pkg?.title ?? "Care plan", status: p.status as "active" | "complete" | "cancelled",
      escrow: p.chainPlanId != null, lockedUsd: p.status === "active" && p.chainPlanId != null ? mine.filter((s) => s.status === "pending").reduce((a, s) => a + s.priceUsd, 0) : 0,
      totalUsd: mine.reduce((a, s) => a + s.priceUsd, 0), doneCount: mine.filter((s) => s.status === "done").length, nextStepId: p.status === "active" ? next?.id ?? null : null,
      steps: mine, at: p.createdAt.toISOString(),
    };
  });
}
export type PlanView = Awaited<ReturnType<typeof plansForPasses>>[number];

/** Visits waiting at a clinic, and the ones it has completed. Shows the patient's first name only. */
export async function visitsForClinic(clinicId: string) {
  const mine = await db.select({ s: schema.careStep, p: schema.carePlan, fullName: schema.pass.fullName }).from(schema.careStep)
    .innerJoin(schema.carePlan, eq(schema.carePlan.id, schema.careStep.planId)).innerJoin(schema.pass, eq(schema.pass.id, schema.carePlan.passId))
    .where(and(eq(schema.careStep.clinicId, clinicId), inArray(schema.carePlan.status, ["active", "complete"]))).orderBy(desc(schema.careStep.doneAt), asc(schema.careStep.idx)).limit(100);
  return mine.map(({ s, p, fullName }) => ({
    id: s.id, title: s.title, priceUsd: s.priceCents / 100, status: s.status as "pending" | "done", doneAt: s.doneAt?.toISOString() ?? null,
    patient: fullName.split(" ")[0] + " " + (fullName.split(" ")[1]?.[0] ?? "") + ".", package: packageById(p.packageId)?.title ?? "Care plan",
  }));
}

type Result<T> = { ok: true; value: T } | { ok: false; status: number; error: string };
const fail = (status: number, error: string): { ok: false; status: number; error: string } => ({ ok: false, status, error });

export async function createPlan(me: Me, input: { passId: string; packageId: string; providers: Record<string, string> }): Promise<Result<string>> {
  const pass = await getOwnedPass(me, input.passId, me.role === "sponsor" ? "sponsor" : "family");
  if (!pass) return fail(404, "Pass not found.");
  const pkg = packageById(input.packageId);
  if (!pkg) return fail(400, "Choose a care package.");
  const [open] = await db.select({ id: schema.carePlan.id }).from(schema.carePlan).where(and(eq(schema.carePlan.passId, pass.id), eq(schema.carePlan.status, "active"))).limit(1);
  if (open) return fail(409, "This pass already has a care plan in progress.");
  const cats = [...new Set(pkg.steps.map((s) => s.category))];
  const allowed = pass.allowed as string[];
  const missing = cats.find((c) => !allowed.includes(c));
  if (missing) return fail(400, "This pass doesn't allow every kind of care in this package. The sponsor can turn them on in the pass rules.");
  const clinics = await db.select().from(schema.clinic).where(and(inArray(schema.clinic.id, Object.values(input.providers).filter(Boolean)), eq(schema.clinic.verified, true)));
  const byId = new Map(clinics.map((c) => [c.id, c]));
  for (const c of cats) {
    const clinic = byId.get(input.providers[c]);
    if (!clinic || clinic.type !== c) return fail(400, "Choose a verified provider for each step.");
    if (clinic.city !== pass.city) return fail(400, `Choose providers in ${pass.city}.`);
  }
  const planId = uid();
  const rows = pkg.steps.map((s, idx) => ({ id: uid(), planId, idx, title: s.title, category: s.category, priceCents: s.priceCents, clinicId: input.providers[s.category] }));
  await db.insert(schema.carePlan).values({ id: planId, passId: pass.id, packageId: pkg.id, createdBy: me.id });
  await db.insert(schema.careStep).values(rows);
  if (escrowOn()) {
    // Lock the money for every step on the network now, so it can't be spent elsewhere or taken back until each visit is confirmed.
    try {
      const chainPlanId = await openPlanOnChain(pass.id, rows.map((r) => ({ clinicId: r.clinicId, cents: r.priceCents })));
      if (chainPlanId != null) await db.update(schema.carePlan).set({ chainPlanId }).where(eq(schema.carePlan.id, planId));
    } catch (e) {
      await db.delete(schema.carePlan).where(eq(schema.carePlan.id, planId)); // the plan did not start: nothing was locked
      if (e instanceof ChainError && e.code === 7) return fail(409, "The pass needs more money first: a care plan locks the full amount up front. Top up the pass, then start the plan.");
      if (e instanceof ChainError && e.code && CONTRACT_REASON[e.code]) return fail(409, CONTRACT_REASON[e.code]);
      console.error("[chain] open plan failed:", e instanceof Error ? e.message : e);
      return fail(502, "We couldn't reach the payment network just now. Nothing was started. Please try again.");
    }
  }
  return { ok: true, value: planId };
}

export async function cancelPlan(me: Me, planId: string): Promise<Result<true>> {
  const [plan] = await db.select().from(schema.carePlan).where(eq(schema.carePlan.id, planId));
  if (!plan) return fail(404, "Plan not found.");
  if (!(await getOwnedPass(me, plan.passId, me.role === "sponsor" ? "sponsor" : "family"))) return fail(404, "Plan not found.");
  if (plan.status === "active" && plan.chainPlanId != null) {
    try { await cancelPlanOnChain(plan.passId, plan.chainPlanId); } // unlocks the money that hasn't been released
    catch (e) { console.error("[chain] cancel plan failed:", e instanceof Error ? e.message : e); return fail(502, "We couldn't reach the payment network just now. The plan is still active. Please try again."); }
  }
  await db.update(schema.carePlan).set({ status: "cancelled" }).where(and(eq(schema.carePlan.id, planId), eq(schema.carePlan.status, "active")));
  return { ok: true, value: true };
}

/** The code for a step. Only the family sees it, and only for the step that is next. */
export async function codeFor(me: Me, stepId: string): Promise<Result<{ code: string; clinicName: string; title: string }>> {
  const [r] = await db.select({ s: schema.careStep, p: schema.carePlan, c: schema.clinic.name }).from(schema.careStep)
    .innerJoin(schema.carePlan, eq(schema.carePlan.id, schema.careStep.planId)).innerJoin(schema.clinic, eq(schema.clinic.id, schema.careStep.clinicId)).where(eq(schema.careStep.id, stepId));
  if (!r || !(await getOwnedPass(me, r.p.passId, "family"))) return fail(404, "Step not found.");
  if (r.p.status !== "active" || r.s.status !== "pending") return fail(409, "This step is already done.");
  const [next] = await db.select().from(schema.careStep).where(and(eq(schema.careStep.planId, r.p.id), eq(schema.careStep.status, "pending"))).orderBy(asc(schema.careStep.idx)).limit(1);
  if (next?.id !== stepId) return fail(409, "Finish the earlier steps first.");
  return { ok: true, value: { code: visitCode(stepId), clinicName: r.c, title: r.s.title } };
}

/** A clinic confirms a visit by entering the family's code. That releases the step's payment from the pass. */
export async function confirmVisit(clinic: ClinicRow, rawCode: string): Promise<Result<{ title: string; priceUsd: number; patient: string; receiptId: string }>> {
  if (clinic.codeLockUntil && clinic.codeLockUntil > new Date()) return fail(429, "Too many wrong codes. Try again in a few minutes.");
  const code = rawCode.replace(/\D/g, "");
  if (code.length !== 6) return fail(400, "Enter the 6-digit visit code.");
  const pending = await db.select({ s: schema.careStep, p: schema.carePlan }).from(schema.careStep)
    .innerJoin(schema.carePlan, eq(schema.carePlan.id, schema.careStep.planId))
    .where(and(eq(schema.careStep.clinicId, clinic.id), eq(schema.careStep.status, "pending"), eq(schema.carePlan.status, "active")));
  let hit: { s: Step; p: typeof schema.carePlan.$inferSelect } | undefined;
  for (const r of pending) {
    if (visitCode(r.s.id) !== code) continue;
    const [next] = await db.select().from(schema.careStep).where(and(eq(schema.careStep.planId, r.p.id), eq(schema.careStep.status, "pending"))).orderBy(asc(schema.careStep.idx)).limit(1);
    if (next?.id === r.s.id) { hit = r; break; }
  }
  if (!hit) {
    const fails = clinic.codeFails + 1;
    await db.update(schema.clinic).set(fails >= 5 ? { codeFails: 0, codeLockUntil: new Date(Date.now() + 10 * 60_000) } : { codeFails: fails }).where(eq(schema.clinic.id, clinic.id));
    return fail(400, "That code doesn't match a visit waiting at your clinic.");
  }
  await db.update(schema.clinic).set({ codeFails: 0 }).where(eq(schema.clinic.id, clinic.id));
  const [claimed] = await db.update(schema.careStep).set({ status: "done", doneAt: new Date() }).where(and(eq(schema.careStep.id, hit.s.id), eq(schema.careStep.status, "pending"))).returning();
  if (!claimed) return fail(409, "This visit was already confirmed.");
  const [pass] = await db.select().from(schema.pass).where(eq(schema.pass.id, hit.p.passId));
  const paid = await payClinic(pass, clinic, claimed.priceCents, claimed.title, hit.p.chainPlanId != null ? { chainPlanId: hit.p.chainPlanId, index: claimed.idx } : undefined);
  if (!paid.ok) {
    await db.update(schema.careStep).set({ status: "pending", doneAt: null }).where(eq(schema.careStep.id, claimed.id)); // nothing was spent: the visit stays open
    return fail(paid.status, paid.error);
  }
  await db.update(schema.careStep).set({ ledgerId: paid.tx.id }).where(eq(schema.careStep.id, claimed.id));
  const [left] = await db.select({ id: schema.careStep.id }).from(schema.careStep).where(and(eq(schema.careStep.planId, hit.p.id), eq(schema.careStep.status, "pending"))).limit(1);
  if (!left) await db.update(schema.carePlan).set({ status: "complete" }).where(eq(schema.carePlan.id, hit.p.id));
  return { ok: true, value: { title: claimed.title, priceUsd: claimed.priceCents / 100, patient: pass.fullName.split(" ")[0], receiptId: paid.tx.id } };
}
export { PACKAGES };
