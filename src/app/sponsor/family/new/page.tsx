"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Info } from "lucide-react";
import { BackLink, Button, PageHeader } from "@/components/ui/ui";
import { Chip, Field, Segmented } from "@/components/ui/forms";
import { useStore } from "@/lib/store";
import { CITIES, City } from "@/lib/data";
import { formatNgPhone, phoneDigits } from "@/lib/format";

const RELATIONS = ["Mom", "Dad", "Sister", "Brother", "Grandparent", "Spouse", "Other"];

export default function NewFamily() {
  const router = useRouter();
  const { addBeneficiary, toast } = useStore();
  const [fullName, setFullName] = useState("");
  const [relation, setRelation] = useState("Mom");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState<City>("Lagos");
  const [touched, setTouched] = useState({ name: false, phone: false });

  const nameOk = fullName.trim().split(/\s+/).length >= 2;
  const phoneOk = phoneDigits(phone).length >= 13;
  const ok = nameOk && phoneOk;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, phone: true });
    if (!ok) return;
    const b = addBeneficiary({ fullName: fullName.trim().replace(/\s+/g, " "), name: fullName.trim().split(/\s+/)[0], relation, phone, city });
    toast(`${b.name} added`);
    router.push(`/sponsor/care/new?for=${b.id}`);
  }

  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <BackLink href="/sponsor/family">Family</BackLink>
      <PageHeader title="Add a family member" sub="Who is the care for? We’ll use their city to show providers nearby." />
      <form onSubmit={submit} noValidate className="space-y-6">
        <Field label="Full name" placeholder="e.g. Adebola Okonkwo" autoComplete="off" value={fullName} onChange={(e) => setFullName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))} error={touched.name && !nameOk ? "Enter their first and last name." : undefined} />

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Relationship</legend>
          <div className="flex flex-wrap gap-2">{RELATIONS.map((r) => <Chip key={r} on={relation === r} onClick={() => setRelation(r)}>{r}</Chip>)}</div>
        </fieldset>

        <Field label="Phone number" type="tel" inputMode="tel" autoComplete="off" placeholder="+234 802 555 0142" value={phone}
          onChange={(e) => setPhone(formatNgPhone(e.target.value))} onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
          error={touched.phone && !phoneOk ? "Enter a valid Nigerian mobile number." : undefined}
          hint="They’ll use this number to open their family pass." />

        <div>
          <div className="mb-2 text-sm font-semibold">City</div>
          <Segmented<City> label="City" value={city} onChange={setCity} options={CITIES.map((c) => ({ value: c, label: c }))} />
        </div>

        <p className="flex items-start gap-2.5 rounded-xl bg-canvas-2/70 p-3.5 text-[13px] leading-relaxed text-ink-soft">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" />You’ll only ever see their care progress. Medical details and documents stay between them and the provider.
        </p>

        <Button type="submit" size="lg" full>Add and choose care</Button>
      </form>
    </div>
  );
}
