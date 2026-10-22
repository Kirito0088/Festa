"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { currentIsoDate } from "@/hooks/use-today";
import { errorMessage } from "@/lib/errors";

/**
 * Starts an isolated demo session: an anonymous account seeded with a
 * clearly labelled sample celebration.
 */
export function DemoButton({
  variant = "outline",
  size = "lg",
  className,
  label = "Explore the demo",
}: {
  variant?: "outline" | "secondary" | "ghost" | "default";
  size?: "default" | "lg";
  className?: string;
  label?: string;
}) {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const startDemo = useMutation(api.demo.start);
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "signing-in" | "seeding">("idle");
  const seeding = useRef(false);

  // Seed once the anonymous session is authenticated.
  useEffect(() => {
    if (phase !== "signing-in" || !isAuthenticated || !me?.isDemo || seeding.current) return;
    seeding.current = true;
    setPhase("seeding");
    startDemo({ today: currentIsoDate() })
      .then((eventId) => router.push(`/events/${eventId}`))
      .catch((error: unknown) => {
        toast.error(errorMessage(error, "We couldn't start the demo. Please try again."));
        seeding.current = false;
        setPhase("idle");
      });
  }, [phase, isAuthenticated, me, startDemo, router]);

  const busy = phase !== "idle";

  async function handleClick() {
    if (busy) return;
    if (isAuthenticated && me && !me.isDemo) {
      router.push("/events");
      return;
    }
    setPhase("signing-in");
    if (!isAuthenticated) {
      try {
        await signIn("anonymous");
      } catch {
        toast.error("We couldn't start a demo session. Please try again.");
        setPhase("idle");
      }
    }
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleClick} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
      {busy ? "Preparing the demo…" : label}
    </Button>
  );
}
