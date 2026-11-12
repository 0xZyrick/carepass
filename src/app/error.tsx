"use client";

import { TriangleAlert } from "lucide-react";
import { Button, Logo } from "@/components/ui/ui";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Logo className="mb-10" />
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sun-50 text-sun-600"><TriangleAlert className="h-8 w-8" /></span>
        <h1 className="mt-6 text-4xl font-bold">Something went wrong</h1>
        <p className="mx-auto mt-2 max-w-sm text-ink-mute">An unexpected error occurred. Your data is safe. Try again, or head back home.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={reset}>Try again</Button>
          <Button href="/" size="lg" variant="outline">Back to home</Button>
        </div>
      </div>
    </main>
  );
}
