import { Nfc, Lock, Snowflake } from "lucide-react";
import clsx from "clsx";
import { Hue } from "@/lib/data";
import { ngn, usd } from "@/lib/format";

const BG: Record<Hue, string> = {
  brand: "from-brand-600 via-brand-700 to-brand-900",
  iris: "from-[#6C63F0] via-iris-700 to-[#2B2580]",
  sun: "from-[#D98A0B] via-[#A86A06] to-[#5C3A02]",
  rose: "from-[#E5594B] via-rose-700 to-[#6E1D16]",
};

export function PassCard({
  name, balance, last4, hue = "brand", frozen, hidden, className, compact,
}: {
  name: string; balance: number; last4: string; hue?: Hue; frozen?: boolean; hidden?: boolean; className?: string; compact?: boolean;
}) {
  return (
    <div
      className={clsx(
        "relative isolate aspect-[1.5/1] w-full overflow-hidden rounded-[26px] bg-gradient-to-br p-5 text-white shadow-[0_24px_48px_-20px_rgba(5,38,25,.7)]",
        BG[hue], className
      )}
    >
      <div className="grain absolute inset-0 -z-10" />
      <div className="absolute -right-16 -top-20 -z-10 h-56 w-56 rounded-full bg-white/10" />
      <div className="absolute -bottom-24 -left-10 -z-10 h-52 w-52 rounded-full bg-black/10" />

      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-[15px] font-extrabold tracking-tight">CarePass</div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-white/75">
            <Lock className="h-3 w-3" /> Merchant-locked
          </div>
        </div>
        <Nfc className="h-6 w-6 rotate-90 text-white/80" aria-hidden />
      </div>

      <div className={clsx("absolute inset-x-5", compact ? "bottom-12" : "bottom-14")}>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Available care credit</div>
        <div className={clsx("num mt-1 font-extrabold leading-none", compact ? "text-[30px]" : "text-[38px]")}>
          {hidden ? "$•••••" : usd(balance)}
        </div>
        <div className="mt-1 text-[13px] font-medium text-white/75">{hidden ? "₦••••••" : `≈ ${ngn(balance)}`}</div>
      </div>

      <div className="absolute inset-x-5 bottom-4 flex items-center justify-between text-[12px] font-semibold text-white/85">
        <span className="truncate pr-3">{name}</span>
        <span className="font-mono tracking-wider">•••• {last4}</span>
      </div>

      {frozen && (
        <div className="absolute inset-0 grid place-items-center bg-brand-950/70 backdrop-blur-[3px]">
          <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink">
            <Snowflake className="h-4 w-4 text-iris-500" /> Pass frozen
          </span>
        </div>
      )}
    </div>
  );
}
