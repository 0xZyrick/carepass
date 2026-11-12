import { Check, Paperclip } from "lucide-react";
import clsx from "clsx";
import { Confirmation, when } from "@/lib/care";
import { usd } from "@/lib/format";

interface Props {
  steps: string[];
  done: number;
  confirms?: Record<number, Confirmation>;
  /** Amount released by each confirmed step. Omit to hide money. */
  payout?: number;
  /** Compact marketing variant: no meta lines */
  compact?: boolean;
  /** Dark surface variant */
  dark?: boolean;
}

export function CareTimeline({ steps, done, confirms, payout, compact, dark }: Props) {
  return (
    <ol>
      {steps.map((s, i) => {
        const st = i < done ? "done" : i === done ? "now" : "next";
        const c = confirms?.[i];
        const pays = payout !== undefined && payout > 0 && i > 0;
        const last = i === steps.length - 1;
        return (
          <li key={s} className="flex gap-3.5" aria-current={st === "now" ? "step" : undefined}>
            <div className="flex flex-col items-center">
              <span
                className={clsx(
                  "relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                  st === "done" && "bg-brand-600 text-white",
                  st === "now" && (dark ? "bg-white text-ink" : "bg-ink text-white ring-4 ring-ink/10"),
                  st === "next" && (dark ? "bg-white/10 text-white/60" : "bg-canvas-2 text-ink-mute")
                )}
              >
                {st === "done" ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
              {!last && <span className={clsx("w-0.5 flex-1", compact ? "min-h-4" : "min-h-5", i < done - 1 ? "bg-brand-500" : dark ? "bg-white/15" : "bg-line-strong")} />}
            </div>
            <div className={clsx("min-w-0 flex-1 pt-[3px]", last ? "pb-0" : compact ? "pb-3" : "pb-5")}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className={clsx("text-sm leading-snug", st === "next" ? (dark ? "text-white/55" : "text-ink-mute") : "font-semibold", dark && st !== "next" && "text-white")}>{s}</span>
                {st === "now" && <span className="rounded-full bg-sun-100 px-2 py-0.5 text-[11px] font-bold text-sun-700">Up next</span>}
              </div>
              {!compact && c && (
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs font-medium text-brand-700">
                  <span>Confirmed by {c.by} · {when(c.daysAgo)}</span>
                  {c.receipt && (
                    <a href={c.receipt.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline decoration-brand-300 underline-offset-2">
                      <Paperclip className="h-3 w-3" />Receipt
                    </a>
                  )}
                </div>
              )}
              {!compact && pays && (
                <div className={clsx("mt-0.5 text-xs font-medium", st === "done" ? "text-ink-mute" : "text-ink-faint")}>
                  {st === "done" ? `${usd(payout!)} released to provider` : `${usd(payout!)} released on confirmation`}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
