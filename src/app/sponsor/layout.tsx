import { SponsorShell } from "@/components/SponsorShell";

export const metadata = { title: "Sponsor" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SponsorShell>{children}</SponsorShell>;
}
