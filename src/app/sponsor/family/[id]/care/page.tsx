"use client";
import { useParams } from "next/navigation";
import { NewPlan } from "@/components/NewPlan";

export default function SponsorPlanCare() {
  const { id } = useParams<{ id: string }>();
  return <NewPlan passId={id} back={`/sponsor/family/${id}`} />;
}
