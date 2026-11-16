import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInFlow } from "./SignInFlow";
import { getMe } from "@/server/auth";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const me = await getMe();
  if (me?.role) redirect(me.role === "sponsor" ? "/sponsor" : me.role === "clinic" ? "/clinic" : "/pass");
  return (
    <Suspense>
      <SignInFlow />
    </Suspense>
  );
}
