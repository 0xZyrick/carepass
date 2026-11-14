"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, MessageSquareText, X } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/ui";
import { PassCard } from "@/components/PassCard";
import { RulesEditor, Rules } from "@/components/RulesEditor";
import { useStore } from "@/lib/store";
import { Beneficiary } from "@/lib/data";

const RELATIONS = ["Mom", "Dad", "Sister", "Brother", "Grandparent", "Spouse", "Other"];
const input = "mt-2 h-[52px] w-full rounded-2xl border border-line-strong bg-white px-4 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15";

export default function NewFamily() {
  const router = useRouter();
  const { addBeneficiary, setActivePassId, me } = useStore();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [relation, setRelation] = useState("Mom");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState<"Lagos" | "Abuja">("Lagos");
  const [rules, setRules] = useState<Rules>({ monthlyLimit: 250, perTxLimit: 100, allowed: ["hospital", "lab", "pharmacy"] });
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Beneficiary | null>(null);
  const [touched, setTouched] = useState(false);

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const detailsOk = fullName.trim().split(" ").length >= 2 && emailOk;

  async function create() {
    setBusy(true);
    const b = await addBeneficiary({ fullName: fullName.trim(), email: email.trim(), relation, phone, city, ...rules });
    setBusy(false);
    if (b) setCreated(b);
  }

  if (created)
    return (
      <div className="mx-auto max-w-md animate-fade-up py-4 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-500 text-white shadow-glow"><Check className="h-8 w-8" strokeWidth={3} /></span>
        <h1 className="mt-6 text-3xl font-extrabold">{created.name}'s pass is ready</h1>
        <p className="mt-2 text-ink-mute">Ask them to sign in with <strong className="break-all text-ink">{created.email}</strong> to see it.</p>
        <div className="mx-auto mt-7 max-w-[320px]"><PassCard name={created.fullName} balance={0} last4={created.last4} hue={created.hue} compact /></div>
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white p-4 text-left text-sm shadow-card">
          <MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <p className="text-ink-soft">Tell {created.name}: “{me?.name.split(" ")[0] ?? "Your sponsor"} set up a CarePass for your medical care. Choose <em>I'm receiving care</em> and sign in with your email.”</p>
        </div>
        <div className="mt-7 grid gap-3">
          <Button size="lg" full onClick={() => router.push(`/sponsor/fund?to=${created.id}`)}>Add first funds</Button>
          <Button size="lg" full variant="outline" onClick={() => { setActivePassId(created.id); router.push("/sponsor/family"); }}>Done for now</Button>
        </div>
      </div>
    );

  const labels = ["Details", "Rules", "Review"];
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8 flex items-center justify-between">
        <button onClick={() => (step === 0 ? router.push("/sponsor/family") : setStep(step - 1))} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-card"><ArrowLeft className="h-5 w-5" /></button>
        <div className="text-sm font-bold text-ink-soft">Step {step + 1} of 3 · {labels[step]}</div>
        <Link href="/sponsor/family" aria-label="Cancel" className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-canvas-2"><X className="h-5 w-5" /></Link>
      </div>
      <div className="mb-8 flex gap-2" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className={clsx("h-1.5 flex-1 rounded-full transition-all", i <= step ? "bg-brand-500" : "bg-canvas-2")} />)}</div>

      <div key={step} className="animate-fade-in">
        {step === 0 && (
          <>
            <h1 className="text-3xl font-extrabold sm:text-4xl">Who's the pass for?</h1>
            <p className="mt-2 text-ink-mute">They sign in with their email. No app download required.</p>
            <label className="mt-8 block"><span className="text-sm font-semibold">Full name</span>
              <input className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Adebola Okonkwo" autoComplete="off" />
              {touched && fullName.trim().split(" ").length < 2 && <span className="mt-1.5 block text-sm text-rose-700">Enter first and last name</span>}
            </label>
            <div className="mt-6"><span className="text-sm font-semibold">Relationship</span>
              <div className="mt-2 flex flex-wrap gap-2">{RELATIONS.map((r) => <button key={r} onClick={() => setRelation(r)} className={clsx("h-11 rounded-full border px-5 text-sm font-semibold transition", relation === r ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line-strong bg-white hover:border-ink-faint")}>{r}</button>)}</div>
            </div>
            <label className="mt-6 block"><span className="text-sm font-semibold">Their email address</span>
              <input className={input} value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" autoComplete="off" placeholder="name@example.com" />
              <span className="mt-1.5 block text-xs text-ink-mute">They sign in with this email to see their pass.</span>
              {touched && !emailOk && <span className="mt-1.5 block text-sm text-rose-700">Enter a valid email address</span>}
            </label>
            <label className="mt-6 block"><span className="text-sm font-semibold">Mobile number <span className="font-normal text-ink-mute">(optional)</span></span>
              <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+234 800 000 0000" />
            </label>
            <div className="mt-6"><span className="text-sm font-semibold">City</span>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-canvas-2 p-1.5">{(["Lagos", "Abuja"] as const).map((c) => <button key={c} onClick={() => setCity(c)} className={clsx("h-11 rounded-xl text-sm font-bold transition", city === c ? "bg-white shadow-card" : "text-ink-mute")}>{c}</button>)}</div>
            </div>
            <Button size="lg" full className="mt-9" onClick={() => (detailsOk ? setStep(1) : setTouched(true))}>Continue <ArrowRight className="h-5 w-5" /></Button>
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="text-3xl font-extrabold sm:text-4xl">Set spending rules</h1>
            <p className="mb-8 mt-2 text-ink-mute">You can change these any time. Defaults suit most families.</p>
            <div className="card p-5 sm:p-7"><RulesEditor rules={rules} onChange={setRules} /></div>
            <Button size="lg" full className="mt-8" onClick={() => setStep(2)}>Continue <ArrowRight className="h-5 w-5" /></Button>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="text-3xl font-extrabold sm:text-4xl">Review & create</h1>
            <p className="mb-8 mt-2 text-ink-mute">Check everything looks right.</p>
            <div className="mx-auto mb-6 max-w-[340px]"><PassCard name={fullName || "Family member"} balance={0} last4="••••" hue="brand" compact /></div>
            <dl className="divide-y divide-line rounded-3xl border border-line bg-white text-sm shadow-card">
              {[["Name", fullName], ["Relationship", relation], ["Email", email], ["Mobile", phone || "—"], ["City", city], ["Monthly limit", `$${rules.monthlyLimit}`], ["Per-payment cap", `$${rules.perTxLimit}`], ["Care types", rules.allowed.join(", ")]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 px-5 py-3.5"><dt className="text-ink-mute">{k}</dt><dd className="text-right font-semibold capitalize">{v}</dd></div>
              ))}
            </dl>
            <Button size="lg" full className="mt-8" disabled={busy} onClick={create}>{busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Creating…</> : "Create pass"}</Button>
          </>
        )}
      </div>
    </div>
  );
}
