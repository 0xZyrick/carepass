import { redirect } from "next/navigation";
import { SponsorShell } from "@/components/SponsorShell";
import { getMe } from "@/server/auth";

export const metadata = { title: "Sponsor" };
export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me || !me.role) redirect("/signin");
  if (me.role === "family") redirect("/pass");
  if (me.role === "clinic") redirect("/clinic");
  return <SponsorShell>{children}</SponsorShell>;
}
