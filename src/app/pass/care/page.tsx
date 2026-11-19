"use client";
import { NewPlan } from "@/components/NewPlan";
import { useStore } from "@/lib/store";

export default function PlanCare() {
  const { beneficiaries, activePassId } = useStore();
  const b = beneficiaries.find((x) => x.id === activePassId) ?? beneficiaries[0];
  return <div className="px-5 pb-8 pt-5">{b && <NewPlan passId={b.id} back="/pass" />}</div>;
}
