"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { CalendarHeart, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { markDeliberateSignOut } from "@/components/layout/sign-out-intent";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string | null, email: string | null): string {
  const source = name || email || "F";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "F") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function UserMenu() {
  const me = useQuery(api.users.me);
  const { signOut } = useAuthActions();
  const router = useRouter();

  const label = me?.isDemo ? "Demo session" : (me?.name ?? me?.email ?? "Account");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="grid size-9 cursor-pointer place-items-center rounded-full bg-sage-soft text-[0.75rem] font-semibold text-sage-strong ring-1 ring-[#d5ddd0] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
        aria-label="Account menu"
      >
        {me === undefined ? null : me?.isDemo ? "D" : initials(me?.name ?? null, me?.email ?? null)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/events">
            <CalendarHeart aria-hidden="true" /> Your celebrations
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/events/new">
            <Plus aria-hidden="true" /> New celebration
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            markDeliberateSignOut();
            await signOut();
            router.replace("/");
          }}
        >
          <LogOut aria-hidden="true" /> {me?.isDemo ? "End demo" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
