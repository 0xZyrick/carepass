import { Suspense } from "react";
import { FundFlow } from "./FundFlow";

export const metadata = { title: "Fund care" };

export default function Page() {
  return (
    <Suspense>
      <FundFlow />
    </Suspense>
  );
}
