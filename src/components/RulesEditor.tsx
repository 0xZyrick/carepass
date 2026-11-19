"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import { CATEGORIES, Category } from "@/lib/data";
import { CatIcon } from "@/components/ui/ui";

export interface Rules { allowed: Category[] }

export function RulesEditor({ rules, onChange }: { rules: Rules; onChange: (r: Rules) => void }) {
  const toggle = (c: Category) => {
    const has = rules.allowed.includes(c);
    if (has && rules.allowed.length === 1) return; // always keep at least one
    onChange({ ...rules, allowed: has ? rules.allowed.filter((x) => x !== c) : [...rules.allowed, c] });
  };
  return (
    <div className="space-y-7">
      <div>
        <div className="text-sm font-bold">Allowed care types</div>
        <p className="mt-1 text-sm text-ink-mute">The money only goes to verified providers of these kinds of care. Each care plan sets its own steps and amounts.</p>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {CATEGORIES.map((c) => {
            const on = rules.allowed.includes(c.id);
            return (
              <button key={c.id} type="button" role="checkbox" aria-checked={on} onClick={() => toggle(c.id)}
                className={clsx("flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition", on ? "border-brand-500 bg-brand-50/60" : "border-line bg-white hover:border-line-strong")}>
                <CatIcon type={c.id} className={clsx("!h-10 !w-10", !on && "!bg-canvas !text-ink-faint")} />
                <span className={clsx("flex-1 text-sm font-semibold", !on && "text-ink-mute")}>{c.plural}</span>
                <span className={clsx("grid h-5 w-5 place-items-center rounded-md border-2", on ? "border-brand-500 bg-brand-500 text-white" : "border-line-strong")}>{on && <Check className="h-3 w-3" strokeWidth={4} />}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
