import Link from "next/link";
import { Logo } from "@/components/ui/ui";
import { CONTACT_EMAIL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-brand-950 text-white">
      <div className="container-x py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">Care for family back home. Plan treatment in Nigeria from the US or UK, with every step confirmed by a verified provider.</p>
          </div>
          {[
            { h: "CarePass", l: [["How it works", "/#how"], ["Why it's safe", "/#safe"], ["How it's built", "/about"], ["Try a payment", "/try"]] },
            { h: "Get started", l: [["Sign in", "/signin"], ["Create an account", "/signin?mode=signup"], ["For clinics", "/#clinics"]] },
            { h: "Help", l: [["FAQ", "/#faq"], ["Terms of use", "/terms"], ["Privacy policy", "/privacy"], [CONTACT_EMAIL, `mailto:${CONTACT_EMAIL}`]] },
          ].map((c) => (
            <div key={c.h}>
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">{c.h}</div>
              <ul className="mt-4 space-y-3 text-sm">{c.l.map(([t, h]) => <li key={t}><Link href={h} className="text-white/75 transition hover:text-white">{t}</Link></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:justify-between">
          <span>© 2026 CarePass</span>
          <span>Currently in test mode. No real money moves yet.</span>
        </div>
      </div>
    </footer>
  );
}
