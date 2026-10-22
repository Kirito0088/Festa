"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { Info } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { isDeliberateSignOut } from "@/components/layout/sign-out-intent";
import { UserMenu } from "@/components/layout/user-menu";
import { FestaLogo } from "@/components/ui/festa-logo";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Client-side gate for signed-in pages. This only controls navigation;
 * every Convex function independently enforces authentication and
 * ownership, so hiding UI is never the security boundary.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const signedOut = !isLoading && !isAuthenticated;

  return (
    <>
      <header className="material-bar sticky top-0 z-40 border-b border-[rgb(229_223_212/0.7)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/events" className="rounded-full" aria-label="Festa, your celebrations">
            <FestaLogo />
          </Link>
          {isAuthenticated && <UserMenu />}
        </div>
      </header>
      {/* Pages stay rendered while auth loads, so the static shell keeps their
          skeletons; route-level queries skip until auth settles. */}
      {signedOut ? (
        <>
          <RedirectToSignIn />
          <ShellSkeleton />
        </>
      ) : (
        <>
          {isAuthenticated && <DemoBanner />}
          <main id="main" className="flex-1">
            {children}
          </main>
        </>
      )}
    </>
  );
}

// Kept out of AppShell: usePathname suspends while a dynamic route
// prerenders, which would drop every page from the static shell.
function RedirectToSignIn() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isDeliberateSignOut()) return;
    router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
  }, [pathname, router]);

  return null;
}

function DemoBanner() {
  const me = useQuery(api.users.me);
  if (!me?.isDemo) return null;
  return (
    <aside aria-label="Demo session" className="border-b border-[#eadfc9] bg-sand-soft">
      <div className="mx-auto flex max-w-6xl items-start gap-2.5 px-4 py-2.5 text-[0.8125rem] text-[#5c4b31] sm:items-center sm:px-6">
        <Info className="mt-0.5 size-4 shrink-0 sm:mt-0" aria-hidden="true" />
        <p>
          You&rsquo;re in a private demo session. Sample vendors and prices are illustrative, and demo data
          may be cleared.{" "}
          <Link href="/sign-in?mode=sign-up" className="font-medium underline underline-offset-2">
            Create an account
          </Link>{" "}
          to keep your own plans.
        </p>
      </div>
    </aside>
  );
}

export function ShellSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-12 w-2/3 max-w-md" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
