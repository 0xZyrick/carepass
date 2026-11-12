import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/ui";

export const metadata = { title: "Provider desk" };

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="CarePass home"><Logo /></Link>
            <span className="hidden h-5 w-px bg-line-strong sm:block" />
            <span className="hidden rounded-full bg-ink px-3 py-1 text-xs font-bold text-white sm:inline">Provider desk</span>
          </div>
          <Link href="/sponsor" className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-ink-soft transition hover:bg-canvas-2">
            <ArrowLeft className="h-4 w-4" />Exit demo
          </Link>
        </div>
      </header>
      <main className="container-x pb-16 pt-8 sm:pt-10">{children}</main>
    </div>
  );
}
