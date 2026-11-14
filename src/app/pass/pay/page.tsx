import { Suspense } from "react";
import { PayFlow } from "./PayFlow";

export const metadata = { title: "Pay" };

export default function Page() {
  return (
    <Suspense>
      <PayFlow />
    </Suspense>
  );
}
