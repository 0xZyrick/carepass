"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import clsx from "clsx";
import { Button, Logo } from "@/components/ui/ui";
import { DemoPill } from "@/components/DemoPill";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#partners", label: "Partners" },
  { href: "/#security", label: "Security" },
  { href: "/guardrails", label: "Guardrail lab" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className={clsx("sticky top-0 z-50 transition-all", scrolled || open ? "border-b border-line bg-canvas/90 backdrop-blur-xl" : "border-b border-transparent")}>
      <div className="container-x flex h-[68px] items-center justify-between">
        <Link href="/" aria-label="CarePass home" onClick={() => setOpen(false)}><Logo /></Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-xl px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-canvas-2 hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <DemoPill className="mr-2 hidden xl:inline-flex" />
          <Button href="/signin" variant="ghost">Sign in</Button>
          <Button href="/signin?mode=signup" variant="dark">Get started</Button>
        </div>

        <button className="grid h-11 w-11 place-items-center rounded-xl text-ink hover:bg-canvas-2 md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[68px] animate-fade-in bg-canvas md:hidden">
          <nav className="container-x flex flex-col gap-1 py-6" aria-label="Mobile">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-4 font-display text-2xl font-bold hover:bg-canvas-2">
                {l.label}
              </Link>
            ))}
            <div className="mt-6 grid gap-3">
              <Button href="/signin?mode=signup" size="lg" full>Get started</Button>
              <Button href="/signin" variant="outline" size="lg" full>Sign in</Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
