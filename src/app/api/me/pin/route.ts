import { NextResponse } from "next/server";
import { authed, body, err } from "@/server/http";
import { pinState, setPin, validPin } from "@/server/pin";

/** Creates the account's 4-digit payment PIN. Setting it again is not allowed here. */
export const POST = authed("any", async (req, me) => {
  const b = await body<{ pin?: unknown }>(req);
  if (!validPin(b.pin)) return err("Your PIN must be 4 digits.");
  if ((await pinState(me.id)).hasPin) return err("You already have a PIN.", 409);
  await setPin(me.id, b.pin);
  return NextResponse.json({ ok: true }, { status: 201 });
});
