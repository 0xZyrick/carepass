import type { Metadata } from "next";
import { TryPayment } from "./TryPayment";

export const metadata: Metadata = {
  title: "Try a payment",
  description: "See how CarePass decides whether a payment is allowed, using a sample family pass.",
};

export default function Page() {
  return <TryPayment />;
}
