import { Suspense } from "react";
import { NewCareFlow } from "./NewCareFlow";

export const metadata = { title: "Start care" };

export default function Page() {
  return (
    <Suspense>
      <NewCareFlow />
    </Suspense>
  );
}
