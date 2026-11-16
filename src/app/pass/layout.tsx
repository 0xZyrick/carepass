import { redirect } from "next/navigation";
import { PassShell } from "@/components/PassShell";
import { getMe } from "@/server/auth";
import { SPONSOR_PREVIEW } from "@/server/passes";

export const metadata = { title: "Family pass" };
export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me || !me.role) redirect("/signin");
  if (me.role === "clinic") redirect("/clinic");
  if (me.role === "sponsor" && !SPONSOR_PREVIEW) redirect("/sponsor");
  return <PassShell>{children}</PassShell>;
}
