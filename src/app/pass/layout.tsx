import { PassShell } from "@/components/PassShell";

export const metadata = { title: "Family pass" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PassShell>{children}</PassShell>;
}
