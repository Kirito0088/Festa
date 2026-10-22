"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Last-resort boundary. Internal error details are never shown to users. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <p className="type-eyebrow">Something went wrong</p>
      <h1 className="type-display mt-3 text-[2.75rem]">Let&rsquo;s try that again.</h1>
      <p className="mt-3 max-w-sm text-[0.9375rem] text-muted-foreground">
        Your plans are safe. Reload this view, or head back to your celebrations.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>
          <RotateCcw aria-hidden="true" /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/events">Your celebrations</Link>
        </Button>
      </div>
    </main>
  );
}
