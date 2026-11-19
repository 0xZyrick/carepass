"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { ButtonHTMLAttributes, ReactNode, useEffect, useId, useMemo, useRef } from "react";
import {
  Building2, CheckCircle2, Eye, FlaskConical, Glasses, Pill, Smile, Stethoscope, TriangleAlert, X,
} from "lucide-react";
import clsx from "clsx";
import { Category, Hue } from "@/lib/data";
import { ngn, usd } from "@/lib/format";
import { useStore } from "@/lib/store";

/* ---------- Brand ---------- */
export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid h-8 w-8 place-items-center rounded-[10px] bg-brand-500 shadow-[inset_0_-3px_0_rgba(0,0,0,.12)]">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-7-4.4-7-10.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7 2.8C19 16.6 12 21 12 21Z" />
          <path d="M12 11.5v4M10 13.5h4" stroke="#CFF0E0" />
        </svg>
      </span>
      <span className={clsx("font-display text-[21px] font-semibold tracking-tight", light ? "text-white" : "text-ink")}>
        CarePass
      </span>
    </span>
  );
}

/* ---------- Button ---------- */
type Variant = "primary" | "dark" | "soft" | "ghost" | "outline" | "danger" | "light";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-500 text-white shadow-[0_1px_0_rgba(255,255,255,.2)_inset,0_6px_16px_-6px_rgba(0,168,107,.7)] hover:bg-brand-600",
  dark: "bg-ink text-white hover:bg-brand-950",
  soft: "bg-brand-50 text-brand-800 hover:bg-brand-100",
  ghost: "text-ink-soft hover:bg-canvas-2",
  outline: "border border-line-strong bg-white text-ink hover:border-ink-faint",
  danger: "bg-rose-50 text-rose-700 hover:bg-rose-100",
  light: "bg-white text-brand-900 hover:bg-brand-50",
};
const SIZES = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-[52px] px-7 text-[15px] gap-2.5",
};
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: keyof typeof SIZES;
  href?: string;
  full?: boolean;
  icon?: ReactNode;
}
export function Button({ variant = "primary", size = "md", href, full, icon, className, children, ...rest }: BtnProps) {
  const cls = clsx(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-2xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
    VARIANTS[variant], SIZES[size], full && "w-full", className
  );
  if (href)
    return (
      <Link href={href} className={cls}>
        {icon}{children}
      </Link>
    );
  return (
    <button className={cls} {...rest}>
      {icon}{children}
    </button>
  );
}

/* ---------- Hues ---------- */
export const HUE: Record<Hue, { bg: string; soft: string; text: string; ring: string }> = {
  brand: { bg: "bg-gradient-to-br from-brand-400 to-brand-700", soft: "bg-brand-50", text: "text-brand-700", ring: "#00A86B" },
  iris: { bg: "bg-gradient-to-br from-[#8A83F5] to-iris-700", soft: "bg-iris-50", text: "text-iris-700", ring: "#6C63F0" },
  sun: { bg: "bg-gradient-to-br from-sun-400 to-[#D98A0B]", soft: "bg-sun-50", text: "text-sun-600", ring: "#F5B83D" },
  rose: { bg: "bg-gradient-to-br from-[#F27A6E] to-rose-700", soft: "bg-rose-50", text: "text-rose-700", ring: "#E5594B" },
};

export function Avatar({ initials, hue, size = 44 }: { initials: string; hue: Hue; size?: number }) {
  return (
    <span
      className={clsx("grid shrink-0 place-items-center rounded-full font-display font-bold text-white", HUE[hue].bg)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/* ---------- Badge ---------- */
export function Badge({ tone = "brand", children, className }: { tone?: "brand" | "rose" | "sun" | "ink" | "iris"; children: ReactNode; className?: string }) {
  const t = {
    brand: "bg-brand-50 text-brand-700",
    rose: "bg-rose-50 text-rose-700",
    sun: "bg-sun-50 text-sun-600",
    ink: "bg-canvas-2 text-ink-soft",
    iris: "bg-iris-50 text-iris-700",
  }[tone];
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold", t, className)}>
      {children}
    </span>
  );
}

/* ---------- Category icon ---------- */
const CAT_ICON: Record<Category, typeof Building2> = {
  hospital: Stethoscope, lab: FlaskConical, pharmacy: Pill, dental: Smile, optical: Glasses,
};
export function CatIcon({ type, className, boxed = true }: { type: Category; className?: string; boxed?: boolean }) {
  const I = CAT_ICON[type] ?? Building2;
  if (!boxed) return <I className={className} />;
  return (
    <span className={clsx("grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700", className)}>
      <I className="h-5 w-5" />
    </span>
  );
}

/* ---------- Toggle ---------- */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-brand-500" : "bg-line-strong")}
    >
      <span className={clsx("absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

/* ---------- Range with fill ---------- */
export function Range({ value, min, max, step, onChange, label }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; label: string }) {
  return (
    <input
      type="range" aria-label={label} min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(+e.target.value)}
      style={{ ["--fill" as string]: `${((value - min) / (max - min)) * 100}%` }}
    />
  );
}

/* ---------- Progress ---------- */
export function Progress({ value, max, tone = "brand" }: { value: number; max: number; tone?: "brand" | "sun" | "rose" }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct > 90 ? "bg-rose-500" : pct > 70 ? "bg-sun-400" : tone === "sun" ? "bg-sun-400" : "bg-brand-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-canvas-2" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemax={max}>
      <div className={clsx("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ---------- Sheet (bottom sheet on mobile, centered modal on desktop) ---------- */
export function Sheet({ open, onClose, title, children, tall, phone }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; tall?: boolean; phone?: boolean }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  const node = (
    <div className={clsx("fixed inset-0 z-[80] flex items-end justify-center", !phone && "sm:items-center sm:p-6")} role="dialog" aria-modal aria-labelledby={title ? id : undefined}>
      <button aria-label="Close" className="absolute inset-0 animate-fade-in bg-brand-950/55 backdrop-blur-[3px]" onClick={onClose} />
      <div
        ref={ref} tabIndex={-1}
        className={clsx(
          "relative flex max-h-[92%] w-full animate-sheet-up flex-col rounded-t-[28px] bg-white shadow-pop outline-none",
          !phone && "sm:max-w-md sm:animate-scale-in sm:rounded-[28px]",
          !phone && tall && "sm:max-w-lg"
        )}
      >
        <div className={clsx("mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line-strong", !phone && "sm:hidden")} />
        <div className="flex items-center justify-between px-6 pb-2 pt-4">
          <h2 id={id} className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-canvas text-ink-soft hover:bg-canvas-2">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-[max(1.5rem,var(--safe-bottom))] pt-2">{children}</div>
      </div>
    </div>
  );
  return phone ? node : createPortal(node, document.body);
}

/* ---------- Toasts ---------- */
export function ToastHost() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex animate-scale-in items-center gap-2.5 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-pop">
          {t.tone === "ok" ? <CheckCircle2 className="h-4 w-4 text-brand-300" /> : <TriangleAlert className="h-4 w-4 text-sun-400" />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({ title, sub, action, back }: { title: string; sub?: string; action?: ReactNode; back?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="min-w-0">
        {back}
        <h1 className="text-[28px] font-extrabold leading-tight sm:text-[34px]">{title}</h1>
        {sub && <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-ink-mute">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-canvas-2 text-ink-mute">{icon}</span>
      <div className="mt-4 font-bold">{title}</div>
      <p className="mt-1 max-w-xs text-sm text-ink-mute">{sub}</p>
    </div>
  );
}

/* ---------- Balance with hide toggle icon ---------- */
export const EyeIcon = Eye;

/* ---------- Deterministic QR-style pattern ---------- */
export function QRPattern({ seed, size = 200, fg = "#10231C" }: { seed: string; size?: number; fg?: string }) {
  const N = 25;
  const cells = useMemo(() => {
    let h = 2166136261;
    for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)), ((h >>> 0) % 1000) / 1000);
    const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
    const out: [number, number][] = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inFinder(x, y) && rnd() > 0.52) out.push([x, y]);
    return out;
  }, [seed]);
  const finder = (x: number, y: number) => (
    <g key={`${x}${y}`} transform={`translate(${x} ${y})`}>
      <rect width="7" height="7" rx="1.6" fill={fg} />
      <rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
      <rect x="2" y="2" width="3" height="3" rx=".7" fill={fg} />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} width={size} height={size} role="img" aria-label="Pass QR code" shapeRendering="crispEdges">
      <rect x="-1" y="-1" width={N + 2} height={N + 2} fill="white" />
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" rx=".2" fill={fg} />)}
      {finder(0, 0)}{finder(N - 7, 0)}{finder(0, N - 7)}
    </svg>
  );
}

/* ---------- Money: dollars and Naira, side by side ---------- */
const MONEY = { sm: ["text-[15px]", "text-xs"], md: ["text-2xl", "text-sm"], lg: ["text-[40px] leading-none", "text-base"], xl: ["text-[52px] leading-none", "text-lg"] } as const;
export function Money({ amount, size = "md", sign = "", className, digits = 2, hide }: { amount: number; size?: keyof typeof MONEY; sign?: string; className?: string; digits?: number; hide?: boolean }) {
  const [a, b] = MONEY[size];
  return (
    <span className={clsx("inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5", className)}>
      <span className={clsx("num font-bold", a)}>{hide ? "$•••••" : sign + usd(amount, digits)}</span>
      <span className={clsx("num font-medium opacity-60", b)}>{hide ? "₦••••••" : ngn(amount)}</span>
    </span>
  );
}

/* ---------- Stamp: a status label. Flat pill inside the product; the slanted ink stamp is for marketing pages only (slant) ---------- */
export function Stamp({ tone = "ok", children, className, slant }: { tone?: "ok" | "no" | "wait"; children: ReactNode; className?: string; slant?: boolean }) {
  const ink = tone === "ok" ? "border-brand-600/70 text-brand-700" : tone === "no" ? "border-rose-500/70 text-rose-700" : "border-sun-600/60 text-sun-600";
  const flat = tone === "ok" ? "bg-brand-50 text-brand-800" : tone === "no" ? "bg-rose-50 text-rose-700" : "bg-sun-50 text-sun-600";
  return slant ? (
    <span className={clsx("stamp", ink, className)}>{children}</span>
  ) : (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", flat, className)}>{children}</span>
  );
}
