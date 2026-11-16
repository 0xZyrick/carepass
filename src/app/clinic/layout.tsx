import { redirect } from "next/navigation";
import { ClinicShell } from "@/components/ClinicShell";
import { getMe } from "@/server/auth";

export const metadata = { title: "Clinic" };
export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me || !me.role) redirect("/signin");
  if (me.role === "sponsor") redirect("/sponsor");
  if (me.role === "family") redirect("/pass");
  return <ClinicShell>{children}</ClinicShell>;
}
