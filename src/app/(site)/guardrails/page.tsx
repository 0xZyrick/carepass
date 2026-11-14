import type { Metadata } from "next";
import { GuardrailLab } from "./GuardrailLab";

export const metadata: Metadata = {
  title: "Guardrail lab",
  description: "Try a payment and watch each guardrail check run, in the same order the CarePass contract applies them.",
};

export default function Page() {
  return <GuardrailLab />;
}
