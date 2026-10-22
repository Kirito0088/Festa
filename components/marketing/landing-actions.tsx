"use client";

import { useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { DemoButton } from "@/components/auth/demo-button";
import { Button } from "@/components/ui/button";

/** Header actions that adapt to the visitor's session. */
export function HeaderActions() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");

  if (!isLoading && isAuthenticated && me && !me.isDemo) {
    return (
      <Button asChild size="sm">
        <Link href="/events">Open Festa</Link>
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/sign-in?mode=sign-up">Start planning</Link>
      </Button>
    </div>
  );
}

export function HeroActions() {
  return (
    <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
      <Button asChild size="lg">
        <Link href="/sign-in?mode=sign-up">Start planning</Link>
      </Button>
      <DemoButton />
    </div>
  );
}

/** The same two actions at a size that sits side by side on a phone. */
export function CompactActions() {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Button asChild>
        <Link href="/sign-in?mode=sign-up">Start planning</Link>
      </Button>
      <DemoButton size="default" />
    </div>
  );
}
