"use client";

import { InputHTMLAttributes, ReactNode, useId, useRef } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";

/* ---------- Field + input ---------- */
export const inputCls = (invalid?: boolean) =>
  clsx(
    "h-[52px] w-full rounded-xl border bg-white px-4 text-ink outline-none transition placeholder:text-ink-faint",
    "focus:ring-4",
    invalid
      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15"
      : "border-line-strong hover:border-ink-faint focus:border-brand-600 focus:ring-brand-500/15"
  );

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label: string;
  hint?: string;
  error?: string;
  prefix?: ReactNode;
  optional?: boolean;
}
export function Field({ label, hint, error, prefix, optional, className, ...rest }: FieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between text-sm font-semibold">
        <span>{label}</span>
        {optional && <span className="text-xs font-medium text-ink-mute">Optional</span>}
      </label>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[15px] font-semibold text-ink-soft">{prefix}</span>}
        <input
          id={id}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? id + "-d" : undefined}
          className={clsx(inputCls(!!error), prefix && "pl-[4.25rem]")}
          {...rest}
        />
      </div>
      {(error || hint) && (
        <p id={id + "-d"} className={clsx("mt-2 text-[13px]", error ? "font-medium text-rose-700" : "text-ink-mute")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={clsx("grid gap-1 rounded-xl bg-canvas-2 p-1", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={clsx("h-10 rounded-lg px-3 text-sm font-semibold transition", value === o.value ? "bg-white text-ink shadow-card" : "text-ink-mute hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Chip ---------- */
export function Chip({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button" aria-pressed={on} onClick={onClick}
      className={clsx("inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition",
        on ? "border-ink bg-ink text-white" : "border-line-strong bg-white text-ink-soft hover:border-ink-faint", className)}
    >
      {children}
    </button>
  );
}

/* ---------- Selectable card (radio) ---------- */
export function ChoiceCard({ selected, onSelect, children, className, disabled }: { selected: boolean; onSelect: () => void; children: ReactNode; className?: string; disabled?: boolean }) {
  return (
    <button
      type="button" role="radio" aria-checked={selected} disabled={disabled} onClick={onSelect}
      className={clsx(
        "group relative w-full rounded-2xl border bg-white p-4 text-left transition duration-150 disabled:opacity-50",
        selected ? "border-brand-600 shadow-[0_0_0_3px_rgba(15,154,163,.16)]" : "border-line hover:border-line-strong hover:shadow-raise",
        className
      )}
    >
      <span className={clsx("absolute right-3.5 top-3.5 grid h-[22px] w-[22px] place-items-center rounded-full border-2 transition",
        selected ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-white")} aria-hidden>
        {selected && <Check className="h-3.5 w-3.5" strokeWidth={3.2} />}
      </span>
      {children}
    </button>
  );
}

/* ---------- Stepper for wizards ---------- */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav aria-label="Progress" className="mb-7">
      <ol className="flex items-center gap-2">
        {steps.map((s, i) => {
          const st = i < current ? "done" : i === current ? "now" : "next";
          return (
            <li key={s} className={clsx("flex items-center gap-2", i < steps.length - 1 && "flex-1")} aria-current={st === "now" ? "step" : undefined}>
              <span className={clsx("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition",
                st === "done" && "bg-brand-600 text-white", st === "now" && "bg-ink text-white", st === "next" && "bg-canvas-2 text-ink-mute")}>
                {st === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3.2} /> : i + 1}
              </span>
              <span className={clsx("text-[13px] font-semibold", st === "now" ? "text-ink" : "hidden text-ink-mute sm:inline")}>{s}</span>
              {i < steps.length - 1 && <span className={clsx("h-0.5 flex-1 rounded-full transition", i < current ? "bg-brand-500" : "bg-line-strong")} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------- Checkbox row ---------- */
export function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left text-sm">
      <span className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition", checked ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-white")}>
        {checked && <Check className="h-4 w-4" strokeWidth={3.2} />}
      </span>
      <span className={clsx("transition", checked ? "text-ink-mute line-through decoration-ink-faint" : "text-ink-soft")}>{children}</span>
    </button>
  );
}

/* ---------- Segmented digit input (visit codes, OTP) ---------- */
export function CodeInput({ length = 4, value, onChange, invalid, label = "Code", autoFocus }: { length?: number; value: string; onChange: (v: string) => void; invalid?: boolean; label?: string; autoFocus?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const set = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, "");
    if (d.length > 1) {
      onChange(d.slice(0, length));
      refs.current[Math.min(d.length, length - 1)]?.focus();
      return;
    }
    const next = digits.slice();
    next[i] = d;
    onChange(next.join("").slice(0, length));
    if (d && i < length - 1) refs.current[i + 1]?.focus();
  };
  return (
    <div role="group" aria-label={label} className={clsx("flex justify-center gap-2.5", invalid && "animate-shake")}
      onPaste={(e) => { e.preventDefault(); set(0, e.clipboardData.getData("text")); }}>
      {digits.map((d, i) => (
        <input
          key={i} ref={(el) => { refs.current[i] = el; }} value={d} inputMode="numeric" maxLength={length} autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0} aria-label={`${label} digit ${i + 1}`}
          onChange={(e) => set(i, e.target.value)}
          onKeyDown={(e) => { if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus(); }}
          className={clsx("h-16 w-14 rounded-xl border bg-white text-center font-display text-3xl font-bold outline-none transition focus:ring-4 sm:w-16",
            invalid ? "border-rose-500 focus:ring-rose-500/15" : d ? "border-ink-faint focus:border-brand-600 focus:ring-brand-500/15" : "border-line-strong focus:border-brand-600 focus:ring-brand-500/15")}
        />
      ))}
    </div>
  );
}
