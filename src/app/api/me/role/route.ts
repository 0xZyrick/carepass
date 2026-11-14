import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { authed, body, err } from "@/server/http";

/** Sets account type once, right after first sign-in. Never changes an existing role. */
export const POST = authed("any", async (req, me) => {
  const b = await body<{ role?: string; name?: string }>(req);
  if (b.role !== "sponsor" && b.role !== "family") return err("Choose sponsor or family.");
  if (me.role && me.role !== b.role) return NextResponse.json({ role: me.role, changed: false }, { status: 409 });
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 80) : "";
  await db
    .update(schema.user)
    .set({ role: me.role ?? b.role, ...(name ? { name } : {}), updatedAt: new Date() })
    .where(eq(schema.user.id, me.id));
  return NextResponse.json({ role: me.role ?? b.role });
});
