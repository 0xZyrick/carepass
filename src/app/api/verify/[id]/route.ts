import { NextResponse } from "next/server";
import { verifyReceipt } from "@/server/verify";

export const maxDuration = 30;

/** Public: anyone holding a receipt link can check it. The id is an unguessable receipt number. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await verifyReceipt((await params).id);
  return v ? NextResponse.json(v) : NextResponse.json({ error: "Receipt not found." }, { status: 404 });
}
