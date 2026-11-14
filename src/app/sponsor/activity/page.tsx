import { Suspense } from "react";
import { ActivityView } from "./ActivityView";

export const metadata = { title: "Activity" };

export default function Page() {
  return (
    <Suspense>
      <ActivityView />
    </Suspense>
  );
}
