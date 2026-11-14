import { SearchX } from "lucide-react";
import { Button, Logo } from "@/components/ui/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Logo className="mb-10" />
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-canvas-2 text-ink-mute"><SearchX className="h-8 w-8" /></span>
        <h1 className="mt-6 text-4xl font-extrabold">Page not found</h1>
        <p className="mx-auto mt-2 max-w-sm text-ink-mute">The page you're looking for doesn't exist or has moved.</p>
        <Button href="/" size="lg" className="mt-8">Back to home</Button>
      </div>
    </main>
  );
}
