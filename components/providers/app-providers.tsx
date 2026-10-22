"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { spring } from "@/lib/motion";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` to create .env.local.");
}

const convex = new ConvexReactClient(convexUrl);

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      <MotionConfig reducedMotion="user" transition={spring.default}>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster />
        </TooltipProvider>
      </MotionConfig>
    </ConvexAuthProvider>
  );
}
