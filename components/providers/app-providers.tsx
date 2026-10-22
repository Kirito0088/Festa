"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { ConfettiProvider } from "@/components/ui/confetti";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { spring } from "@/lib/motion";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` to create .env.local.");
}

// Festa's writes finish in milliseconds, so the client's "unsaved changes"
// guard adds little. Convex Auth keeps its own brief guard while it rotates
// the refresh token, so leaving mid-rotation can't sign the user out.
const convex = new ConvexReactClient(convexUrl, { unsavedChangesWarning: false });

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      <MotionConfig reducedMotion="user" transition={spring.default}>
        <TooltipProvider delayDuration={300}>
          <ConfettiProvider>{children}</ConfettiProvider>
          <Toaster />
        </TooltipProvider>
      </MotionConfig>
    </ConvexAuthProvider>
  );
}
