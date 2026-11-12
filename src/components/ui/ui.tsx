"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { ButtonHTMLAttributes, ReactNode, useEffect, useId, useRef, useState } from "react";
import {
  ArrowLeft, Baby, Building2, Check, CheckCircle2, Copy, FlaskConical, Glasses, HeartPulse, Loader2,
  Microscope, Pill, Scissors, Smile, Stethoscope, TriangleAlert, X,
} from "lucide-react";
import clsx from "clsx";
import { Category, Hue } from "@/lib/data";
import { PackageIcon } from "@/lib/care";
import { useStore } from "@/lib/store";

/* ---------- Brand ---------- */
export function Logo({ light = false, className, mark = false }: { light?: boolean; className?: string; mark?: boolean }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-700 shadow-btn">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 21s-7.5-4.6-7.5-10.4A4.4 4.4 0 0 1 12 7.9a4.4 4.4 0 0 1 7.5 2.7C19.5 16.4 12 21 12 21Z" />
          <path d="M12 11v4.2M9.9 13.1h4.2" stroke="#D2F3E3" />
        </svg>
      </span>
      {!mark && (
        <span className={clsx("font-display text-[19px] font-bold tracking-tight", light ? "text-white" : "text-ink")}>
          CarePass
        </span>
      )}
    </span>
  );
}

/* ---------- Button ---------- */
type Variant = "primary" | "dark" | "soft" | "ghost" | "outline" | "danger" | "light" | "glass";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-btn hover:bg-brand-700",
  dark: "bg-ink text-white shadow-btn hover:bg-brand-950",
  soft: "bg-brand-50 text-brand-800 hover:bg-brand-100",
  ghost: "text-ink-soft hover:bg-canvas-2 hover:text-ink",
  outline: "border border-line-strong bg-white text-ink shadow-xs hover:border-ink-faint hover:bg-canvas/60",
  danger: "bg-rose-50 text-rose-700 hover:bg-rose-100",
  light: "bg-white text-brand-900 shadow-btn hover:bg-brand-50",
  glass: "border border-white/20 bg-white/10 text-white hover:bg-white/15",
};
const SIZES = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5",
  md: "h-11 px-[18px] text-sm gap-2",
  lg: "h-[52px] px-6 text-[15px] gap-2.5",
};
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: keyof typeof SIZES;
  href?: string;
  external?: boolean;
  full?: boolean;
  icon?: ReactNode;
  loading?: boolean;
}
export function Button({ variant = "primary", size = "md", href, external, full, icon, loading, className, children, disabled, ...rest }: BtnProps) {
  const cls = clsx(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-xl font-semibold transition duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
    VARIANTS[variant], SIZES[size], full && "w-full", className
  );
  if (href && /^(tel:|mailto:|sms:)/.test(href))
    return (
      <a href={href} className={cls}>
        {icon}{children}
      </a>
    );
  if (href && external)
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {icon}{children}
      </a>
    );
  if (href)
    return (
      <Link href={href} className={cls}>
        {icon}{children}
      </Link>
    );
  return (
    <button className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

/* ---------- Hues ---------- */
const HUE: Record<Hue, { bg: string; soft: string; text: string }> = {
  brand: { bg: "bg-gradient-to-br from-brand-400 to-brand-700", soft: "bg-brand-50", text: "text-brand-700" },
  iris: { bg: "bg-gradient-to-br from-[#8F88F7] to-iris-700", soft: "bg-iris-50", text: "text-iris-700" },
  sun: { bg: "bg-gradient-to-br from-sun-400 to-[#C97F0A]", soft: "bg-sun-50", text: "text-sun-600" },
  rose: { bg: "bg-gradient-to-br from-[#F2776A] to-rose-700", soft: "bg-rose-50", text: "text-rose-700" },
};

export function Avatar({ initials, hue, size = 44, ring }: { initials: string; hue: Hue; size?: number; ring?: boolean }) {
  return (
    <span
      className={clsx("grid shrink-0 place-items-center rounded-full font-display font-bold text-white", HUE[hue].bg, ring && "ring-2 ring-white")}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/* ---------- Badge ---------- */
type Tone = "brand" | "rose" | "sun" | "ink" | "iris" | "dark";
const TONES: Record<Tone, { chip: string; dot: string }> = {
  brand: { chip: "bg-brand-50 text-brand-800", dot: "bg-brand-500" },
  rose: { chip: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  sun: { chip: "bg-sun-50 text-sun-700", dot: "bg-sun-400" },
  ink: { chip: "bg-canvas-2 text-ink-soft", dot: "bg-ink-faint" },
  iris: { chip: "bg-iris-50 text-iris-700", dot: "bg-iris-500" },
  dark: { chip: "bg-white/10 text-white", dot: "bg-brand-300" },
};
export function Badge({ tone = "brand", children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none", TONES[tone].chip, className)}>
      {dot && <span className={clsx("h-1.5 w-1.5 rounded-full", TONES[tone].dot)} />}
      {children}
    </span>
  );
}

/* ---------- Icon tile ---------- */
export function IconTile({ children, tone = "brand", size = 44, className }: { children: ReactNode; tone?: "brand" | "sun" | "iris" | "rose" | "ink" | "dark"; size?: number; className?: string }) {
  const t = {
    brand: "bg-brand-50 text-brand-700",
    sun: "bg-sun-50 text-sun-600",
    iris: "bg-iris-50 text-iris-700",
    rose: "bg-rose-50 text-rose-700",
    ink: "bg-canvas-2 text-ink-soft",
    dark: "bg-white/10 text-brand-200",
  }[tone];
  return (
    <span className={clsx("grid shrink-0 place-items-center rounded-xl", t, className)} style={{ width: size, height: size }} aria-hidden>
      {children}
    </span>
  );
}

/* ---------- Category + package icons ---------- */
const CAT_ICON: Record<Category, typeof Building2> = {
  hospital: Stethoscope, lab: FlaskConical, pharmacy: Pill, dental: Smile, optical: Glasses,
};
export function CatIcon({ type, className, boxed = true, size = 44 }: { type: Category; className?: string; boxed?: boolean; size?: number }) {
  const I = CAT_ICON[type] ?? Building2;
  if (!boxed) return <I className={className} />;
  return (
    <IconTile size={size} className={className}>
      <I className="h-5 w-5" />
    </IconTile>
  );
}

const PKG_ICON: Record<PackageIcon, typeof Baby> = { baby: Baby, microscope: Microscope, scissors: Scissors, heartpulse: HeartPulse };
export function PkgIcon({ id, size = 44, tone = "brand", className }: { id: PackageIcon; size?: number; tone?: "brand" | "sun" | "iris" | "rose" | "ink" | "dark"; className?: string }) {
  const I = PKG_ICON[id] ?? HeartPulse;
  return (
    <IconTile size={size} tone={tone} className={className}>
      <I style={{ width: size * 0.5, height: size * 0.5 }} />
    </IconTile>
  );
}

/* ---------- Toggle ---------- */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-brand-600" : "bg-line-strong")}
    >
      <span className={clsx("absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

/* ---------- Progress ---------- */
export function Progress({ value, max, tone = "brand", className, label }: { value: number; max: number; tone?: "brand" | "sun" | "dark"; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={clsx("h-2 w-full overflow-hidden rounded-full", tone === "dark" ? "bg-white/15" : "bg-canvas-2", className)}
      role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max} aria-label={label ?? "Progress"}
    >
      <div className={clsx("h-full rounded-full transition-all duration-700", tone === "sun" ? "bg-sun-400" : tone === "dark" ? "bg-brand-300" : "bg-brand-500")} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ProgressRing({ pct, size = 56, stroke = 6, children, tone = "brand" }: { pct: number; size?: number; stroke?: number; children?: ReactNode; tone?: "brand" | "light" }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={tone === "light" ? "stroke-white/15" : "stroke-canvas-2"} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * Math.min(100, pct)) / 100}
          className={clsx("transition-all duration-700", tone === "light" ? "stroke-brand-300" : "stroke-brand-500")} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[12px] font-bold">{children ?? `${pct}%`}</span>
    </span>
  );
}

/* ---------- Sheet (bottom sheet on mobile, centered modal on desktop) ---------- */
export function Sheet({ open, onClose, title, children, tall, phone, footer }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; tall?: boolean; phone?: boolean; footer?: ReactNode }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    if (!phone) document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    if (!ref.current?.contains(document.activeElement)) ref.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, phone]);
  if (!open) return null;
  const node = (
    <div className={clsx(phone ? "absolute" : "fixed", "inset-0 z-[80] flex items-end justify-center", !phone && "sm:items-center sm:p-6")} role="dialog" aria-modal aria-labelledby={title ? id : undefined}>
      <button aria-label="Close" className="absolute inset-0 animate-fade-in bg-brand-950/50 backdrop-blur-[3px]" onClick={onClose} />
      <div
        ref={ref} tabIndex={-1}
        className={clsx(
          "relative flex max-h-[92%] w-full animate-sheet-up flex-col rounded-t-3xl bg-white shadow-pop outline-none",
          !phone && "sm:max-w-md sm:animate-scale-in sm:rounded-3xl",
          !phone && tall && "sm:max-w-xl"
        )}
      >
        <div className={clsx("mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line-strong", !phone && "sm:hidden")} />
        <div className="flex items-center justify-between gap-3 px-5 pb-1 pt-3 sm:px-6 sm:pt-5">
          <h2 id={id} className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-canvas text-ink-soft hover:bg-canvas-2">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5 pt-3 sm:px-6">{children}</div>
        {footer && <div className="border-t border-line px-5 pb-[max(1rem,var(--safe-bottom))] pt-4 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
  return phone ? node : createPortal(node, document.body);
}

/* ---------- Toasts ---------- */
export function ToastHost() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 z-[100] flex flex-col items-center gap-2 px-4" style={{ top: "max(0.75rem, var(--safe-top))" }} role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex max-w-sm animate-toast-in items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-pop">
          {t.tone === "ok" ? <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-brand-300" /> : <TriangleAlert className="h-[18px] w-[18px] shrink-0 text-sun-400" />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({ title, sub, action, back, eyebrow }: { title: string; sub?: string; action?: ReactNode; back?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 sm:mb-8">
      <div className="min-w-0">
        {back}
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-[28px] font-bold leading-tight sm:text-[34px]">{title}</h1>
        {sub && <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-ink-mute">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-lg pr-3 text-sm font-semibold text-ink-soft transition hover:text-ink">
      <ArrowLeft className="h-4 w-4" /> {children}
    </Link>
  );
}

export function Empty({ icon, title, sub, action }: { icon: ReactNode; title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-canvas-2 text-ink-mute [&>svg]:h-6 [&>svg]:w-6">{icon}</span>
      <div className="mt-4 text-base font-bold">{title}</div>
      <p className="mt-1 max-w-xs text-sm text-ink-mute">{sub}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- Section heading used inside app pages ---------- */
export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="text-lg font-bold sm:text-xl">{children}</h2>
      {action}
    </div>
  );
}

/* ---------- Key/value row ---------- */
export function Row({ label, value, strong, mute }: { label: ReactNode; value: ReactNode; strong?: boolean; mute?: boolean }) {
  return (
    <div className={clsx("flex items-baseline justify-between gap-4 py-2 text-sm", strong && "text-base font-bold")}>
      <span className={clsx(mute ? "text-ink-mute" : strong ? "" : "text-ink-soft")}>{label}</span>
      <span className={clsx("num text-right", strong ? "font-bold" : "font-semibold")}>{value}</span>
    </div>
  );
}

/* ---------- Copy button ---------- */
export function CopyButton({ text, label = "Copy", className, light }: { text: string; label?: string; className?: string; light?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); } catch { /* clipboard unavailable */ }
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
      className={clsx("inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition", light ? "bg-white/10 text-white hover:bg-white/15" : "bg-canvas-2 text-ink-soft hover:bg-canvas-3", className)}
    >
      {done ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {done ? "Copied" : label}
    </button>
  );
}

/* ---------- Skeleton ---------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-lg bg-canvas-2", className)} />;
}
