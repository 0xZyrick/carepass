"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import clsx from "clsx";
import { Button, Logo } from "@/components/ui/ui";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/packages", label: "Care packages" },
  { href: "/#trust", label: "Trust & privacy" },
  { href: "/#faq", label: "FAQ" },
  { href: "/provider", label: "For providers" },
];

export function SiteNav() {
  const path = usePathname();
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
  useEffect(() => setOpen(false), [path]);

  return (
    <header className={clsx("sticky top-0 z-50 transition-colors duration-200", scrolled || open ? "border-b border-line bg-canvas/85 backdrop-blur-xl" : "border-b border-transparent")}>
      <div className="container-x flex h-[68px] items-center justify-between gap-6">
        <Link href="/" aria-label="CarePass home" onClick={() => setOpen(false)}><Logo /></Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}
              className={clsx("rounded-lg px-3.5 py-2 text-sm font-semibold transition hover:bg-canvas-2 hover:text-ink", path === l.href ? "text-ink" : "text-ink-soft")}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button href="/signin" variant="ghost">Sign in</Button>
          <Button href="/signin?mode=signup" variant="dark" icon={undefined}>Get started <ArrowRight className="h-4 w-4" /></Button>
        </div>

        <button className="-mr-2 grid h-11 w-11 place-items-center rounded-xl text-ink hover:bg-canvas-2 lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[68px] animate-fade-in overflow-y-auto bg-canvas lg:hidden">
          <nav className="container-x flex min-h-full flex-col py-5" aria-label="Mobile">
            <div className="flex flex-col">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex items-center justify-between border-b border-line py-4 font-display text-[22px] font-semibold">
                  {l.label}<ArrowRight className="h-5 w-5 text-ink-faint" />
                </Link>
              ))}
            </div>
            <div className="mt-auto grid gap-3 pb-6 pt-8">
              <Button href="/signin?mode=signup" size="lg" full>Get started</Button>
              <Button href="/signin" variant="outline" size="lg" full>Sign in</Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
