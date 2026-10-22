import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { FestaLogo } from "@/components/ui/festa-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { HERO_IMAGES, unsplashUrl } from "@/lib/inspiration";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <main id="main" className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="flex flex-col px-6 py-8 sm:px-10">
        <Link href="/" className="w-fit rounded-full" aria-label="Festa home">
          <FestaLogo />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <p className="type-eyebrow">Welcome</p>
          <h1 className="type-display mt-3 text-[2.75rem]">Plan something worth remembering.</h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
            Sign in to keep your celebrations private and in sync across devices.
          </p>
          <div className="mt-9">
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <SignInForm />
            </Suspense>
          </div>
        </div>
      </section>
      <aside className="relative hidden overflow-hidden lg:block" aria-hidden="true">
        <Image
          src={unsplashUrl(HERO_IMAGES.rings, 1400)}
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-x-8 bottom-8 rounded-3xl bg-[rgb(248_246_241/0.82)] p-6 backdrop-blur-xl">
          <p className="type-title text-2xl">“Make room for moments.”</p>
          <p className="mt-2 text-[0.875rem] text-muted-foreground">
            Budget, timeline, vendors and inspiration — calm, in one place.
          </p>
        </div>
      </aside>
    </main>
  );
}
