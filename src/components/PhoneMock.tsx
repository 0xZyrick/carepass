import { BadgeCheck, Check, MapPin, Wallet } from "lucide-react";
import clsx from "clsx";

/**
 * Static illustration of the family pass, used in the marketing hero.
 * Purely presentational: no state, no data fetching.
 */
export function PhoneMock({ className }: { className?: string }) {
  const steps = ["Package selected", "Intake and documents", "Consultation", "Labs and imaging", "Results review"];
  return (
    <div className={clsx("relative mx-auto w-[290px] sm:w-[310px]", className)} aria-hidden>
      <div className="rounded-[44px] border-[9px] border-ink bg-[#F7F9FC] shadow-pop">
        <div className="relative flex items-center justify-between px-6 pb-1 pt-3 text-[11px] font-bold">
          <span>9:41</span>
          <span className="absolute left-1/2 top-2.5 h-[18px] w-20 -translate-x-1/2 rounded-full bg-ink" />
          <span>5G</span>
        </div>
        <div className="space-y-3 px-4 pb-5 pt-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-[13px] font-bold text-white">AO</span>
            <div className="leading-tight">
              <div className="text-[11px] font-medium text-ink-mute">Good morning</div>
              <div className="font-display text-[17px] font-bold">Adebola</div>
            </div>
          </div>

          <div className="rounded-[22px] bg-gradient-to-br from-brand-800 to-brand-950 p-4 text-white">
            <div className="text-[11px] font-semibold text-brand-200">Diagnostic workup</div>
            <div className="mt-1 font-display text-[19px] font-bold leading-tight">Next: Labs and imaging</div>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-brand-100"><MapPin className="h-3.5 w-3.5" />Lagoon Hospital, Ikeja</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full w-1/2 rounded-full bg-brand-300" /></div>
            <div className="mt-1.5 flex justify-between text-[10.5px] text-brand-200"><span>3 of 6 steps</span><span>$48 of $120 paid out</span></div>
          </div>

          <div className="relative overflow-hidden rounded-[20px] bg-white p-4 text-center shadow-card">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-mute">Your visit code</div>
            <div className="mt-1 font-display text-[34px] font-bold tracking-[0.22em] tabular-nums">4829</div>
            <div className="text-[10.5px] text-ink-mute">Show this at reception</div>
          </div>

          <div className="rounded-[20px] bg-white p-4 shadow-card">
            <ol className="space-y-2.5">
              {steps.map((s, i) => (
                <li key={s} className="flex items-center gap-2.5 text-[12px]">
                  <span className={clsx("grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold",
                    i < 3 ? "bg-brand-600 text-white" : i === 3 ? "bg-ink text-white" : "bg-canvas-2 text-ink-mute")}>
                    {i < 3 ? <Check className="h-3 w-3" strokeWidth={3.4} /> : i + 1}
                  </span>
                  <span className={clsx(i > 3 ? "text-ink-mute" : "font-semibold")}>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* floating notification: what the sponsor sees */}
      <div className="absolute -left-4 top-[34%] hidden w-[210px] animate-float rounded-2xl border border-line bg-white p-3 shadow-pop sm:-left-24 sm:block">
        <div className="flex items-start gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700"><BadgeCheck className="h-[18px] w-[18px]" /></span>
          <div className="leading-snug">
            <div className="text-[12px] font-bold">Consultation confirmed</div>
            <div className="text-[11px] text-ink-mute">Lagoon Hospital · 2 days ago</div>
          </div>
        </div>
      </div>
      <div className="absolute -right-3 bottom-16 hidden w-[184px] rounded-2xl border border-line bg-white p-3 shadow-pop [animation:float_7s_ease-in-out_1s_infinite] sm:-right-20 sm:block">
        <div className="flex items-start gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sun-50 text-sun-600"><Wallet className="h-[18px] w-[18px]" /></span>
          <div className="leading-snug">
            <div className="num text-[15px] font-bold">$24.00</div>
            <div className="text-[11px] text-ink-mute">Released to provider</div>
          </div>
        </div>
      </div>
    </div>
  );
}
