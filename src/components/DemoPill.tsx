import { FlaskConical } from "lucide-react";
import clsx from "clsx";

/** Always-visible reminder that nothing here moves real money. */
export function DemoPill({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full bg-sun-50 px-3 py-1.5 text-[11px] font-bold text-sun-600 ring-1 ring-sun-400/40", className)}>
      <FlaskConical className="h-3.5 w-3.5" /> Testnet demo · no real money
    </span>
  );
}
