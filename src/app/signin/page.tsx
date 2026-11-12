import { Suspense } from "react";
import type { Metadata } from "next";
import { SignInFlow } from "./SignInFlow";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return (
    <Suspense>
      <SignInFlow />
    </Suspense>
  );
}
