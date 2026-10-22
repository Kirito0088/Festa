import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CompactActions, HeaderActions, HeroActions } from "@/components/marketing/landing-actions";
import { Story } from "@/components/marketing/story";
import { Bunting } from "@/components/ui/bunting";
import { FestaLogo } from "@/components/ui/festa-logo";
import { HERO_IMAGES, unsplashUrl } from "@/lib/inspiration";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const PALETTE = ["#E9A238", "#C2452D", "#5E7458", "#B08D57", "#E9C7C3"];

const PRINCIPLES = [
  {
    title: "Maths you can trust",
    body: "The AI suggests percentages and priorities. Every rupee is calculated by Festa's own code, never by the model.",
  },
  {
    title: "Nothing changes without you",
    body: "The concierge proposes changes with before-and-after numbers. You choose what to apply.",
  },
  {
    title: "Suggestions, labelled",
    body: "Festa never invents vendors, ratings, prices or availability. Sample data in the demo is marked as such.",
  },
  {
    title: "Works without AI",
    body: "If the free AI quota runs out, a built-in planner takes over and the rest of Festa keeps working.",
  },
];

export default function LandingPage() {
  return (
    <>
      <header className="material-bar sticky top-0 z-40 border-b border-[rgb(229_223_212/0.7)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="rounded-full" aria-label="Festa home">
            <FestaLogo />
          </Link>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 text-[0.875rem] text-muted-foreground md:flex"
          >
            <a href="#story" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#principles" className="transition-colors hover:text-foreground">
              Principles
            </a>
          </nav>
          <HeaderActions />
        </div>
      </header>

      <main id="main" className="flex-1">
        <section className="relative">
          <Bunting colors={PALETTE} flags={14} className="sm:hidden" />
          <Bunting colors={PALETTE} flags={34} className="hidden sm:block" />
          <div className="mx-auto max-w-6xl px-5 pt-10 pb-16 text-center sm:px-6 sm:pt-16 sm:pb-24">
            <h1 className="type-display mx-auto max-w-4xl text-[3.25rem] sm:text-[5rem] lg:text-[6.25rem]">
              Plan the celebration, not the spreadsheet.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-muted-foreground sm:text-[1.1875rem]">
              Festa turns a few answers into a plan you can follow: a budget that adds up, a checklist with
              real dates, the vendors to call, and a concierge for when things change.
            </p>
            <div className="mt-9">
              <HeroActions />
            </div>
            <p className="mt-5 text-[0.8125rem] text-muted-foreground">
              Free to use, private by default, and it keeps working when the AI is offline.
            </p>
            <a
              href="#story"
              className="type-eyebrow mt-14 inline-flex flex-col items-center gap-2 transition-colors hover:text-foreground"
            >
              See how Meera and Kabir planned theirs
              <svg viewBox="0 0 24 40" className="h-8 w-5" aria-hidden="true">
                <path
                  d="M12 2c-3 8 3 16 0 24s0 8 0 12m-6-7 6 7 6-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </section>

        <Story>
          <CompactActions />
        </Story>

        <section id="principles" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 sm:px-6 sm:py-32">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 className="type-display text-[2.75rem] sm:text-[3.5rem]">Honest by design.</h2>
              <p className="mt-4 max-w-md text-[1rem] leading-relaxed text-muted-foreground">
                Planning a celebration means trusting the numbers. Festa uses AI for ideas and wording; the
                decisions stay with you, and the arithmetic stays in Festa&rsquo;s own code.
              </p>
            </div>
            <dl className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
              {PRINCIPLES.map((principle) => (
                <div key={principle.title} className="border-t border-border pt-5">
                  <dt className="text-[1rem] font-medium">{principle.title}</dt>
                  <dd className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
                    {principle.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-6">
          <div className="grid overflow-hidden rounded-[2rem] bg-ink text-ivory md:grid-cols-[1.1fr_1fr]">
            <div className="relative min-h-72">
              <Image
                src={unsplashUrl(HERO_IMAGES.primary, 1200)}
                alt="A wedding mandap decorated with marigolds and white flowers under a chandelier"
                fill
                sizes="(min-width: 768px) 600px, 100vw"
                className="object-cover"
              />
            </div>
            <div className="px-6 py-14 sm:px-12 sm:py-16">
              <h2 className="type-display text-[2.5rem] sm:text-[3.25rem]">Your celebration, next.</h2>
              <p className="mt-4 max-w-md text-[1rem] leading-relaxed text-[#d9d6e4]">
                Make a free account and start with a few questions, or look around Meera and Kabir&rsquo;s
                sample engagement first.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/sign-in?mode=sign-up"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-ivory px-6 text-[0.9375rem] font-medium text-ink transition-transform active:scale-[0.97]"
                >
                  Start planning
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex h-12 items-center justify-center rounded-full px-6 text-[0.9375rem] font-medium text-ivory ring-1 ring-[rgb(248_246_241/0.35)] transition-colors hover:bg-[rgb(248_246_241/0.08)]"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-[0.8125rem] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <FestaLogo className="opacity-80" />
          <p>Built for PromptWars Virtual. Photography from Unsplash.</p>
        </div>
      </footer>
    </>
  );
}
