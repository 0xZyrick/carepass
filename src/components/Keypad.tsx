"use client";

import { Delete } from "lucide-react";

export function Keypad({ onKey, dot = false }: { onKey: (k: string) => void; dot?: boolean }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", dot ? "." : "", "0", "del"];
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Keypad">
      {keys.map((k, i) =>
        k === "" ? <span key={i} /> : (
          <button key={i} onClick={() => onKey(k)} aria-label={k === "del" ? "Delete" : k}
            className="grid h-14 place-items-center rounded-2xl font-display text-2xl font-bold transition active:scale-95 active:bg-canvas-2 xs:h-16">
            {k === "del" ? <Delete className="h-6 w-6 text-ink-soft" /> : k}
          </button>
        )
      )}
    </div>
  );
}
