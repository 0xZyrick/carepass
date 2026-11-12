"use client";

import { ChevronDown, Headset, Lock, MessageCircle } from "lucide-react";
import { IconTile } from "@/components/ui/ui";
import { useStore } from "@/lib/store";

const QA = [
  ["What is the visit code?", "A 4-digit code that proves you were at the visit. Show it to the provider at each step after intake. It changes after every confirmed step."],
  ["Who can see my documents?", "Only your provider. Your family abroad can see progress such as “intake confirmed”, never your documents or results."],
  ["What should I bring?", "Each package lists what to bring on your home screen. Photo ID is needed at every visit."],
  ["I lost my code or can’t open the app.", "Contact support below. We’ll help you and your provider confirm the visit safely."],
  ["Do I have to pay anything?", "Your family arranges and funds the package. If you’re unsure about a charge, ask support before you pay anything."],
];

export default function Help() {
  const { toast } = useStore();
  return (
    <div className="animate-fade-in space-y-6 px-5 pb-8 pt-6">
      <header>
        <h1 className="text-[28px] font-bold">Help</h1>
        <p className="mt-1 text-sm text-ink-mute">Quick answers, and a person if you need one.</p>
      </header>

      <button onClick={() => toast("Demo: support chat would open here")} className="flex w-full items-center gap-4 rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 p-4 text-left text-white shadow-raise transition active:scale-[0.99]">
        <IconTile tone="dark" size={46}><Headset className="h-6 w-6" /></IconTile>
        <div className="min-w-0 flex-1"><div className="font-bold">Message CarePass support</div><div className="text-[13px] text-brand-200">Ask us anything about your care</div></div>
        <MessageCircle className="h-5 w-5 text-brand-200" />
      </button>

      <div className="flex items-start gap-3 rounded-2xl bg-white p-4 text-[13px] leading-relaxed text-ink-soft shadow-card">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />Your documents and medical details are private to you and your provider.
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Common questions</h2>
        <div className="divide-y divide-line rounded-2xl border border-line bg-white shadow-card">
          {QA.map(([q, a]) => (
            <details key={q} className="group px-4">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-bold">{q}<ChevronDown className="h-4 w-4 shrink-0 text-ink-mute transition-transform group-open:rotate-180" /></summary>
              <p className="pb-4 text-sm leading-relaxed text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
