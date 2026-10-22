import { CalendarCheck2, Images, MessagesSquare, ShieldCheck, Sparkles, Store, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { HeaderActions, HeroActions } from "@/components/marketing/landing-actions";
import { FestaLogo } from "@/components/ui/festa-logo";
import { HERO_IMAGES, unsplashUrl } from "@/lib/inspiration";

const FEATURES = [
  {
    icon: Wallet,
    title: "Budget Studio",
    body: "Estimates, actual costs, deposits and payments in one ledger. Overspending shows up the moment it happens.",
  },
  {
    icon: CalendarCheck2,
    title: "Smart timeline",
    body: "Deadlines measured from your date. Move the celebration and every relative task moves with it.",
  },
  {
    icon: Store,
    title: "Vendor desk",
    body: "Quotes, contacts, booking and payment status side by side, so comparing two caterers takes seconds.",
  },
  {
    icon: Images,
    title: "Inspiration board",
    body: "Save looks for decor, colours, invitations, food and venues. Annotate what you love about each.",
  },
];

const STEPS = [
  {
    title: "Tell Festa about it",
    body: "Event type, date, city, guests, budget, style, food and the moments that matter. Skip anything you haven't decided.",
  },
  {
    title: "Get a blueprint",
    body: "A concept, palette, budget split, dated checklist, vendor plan and the risks to watch — generated in seconds.",
  },
  {
    title: "Plan it together",
    body: "Track spending, tick off tasks, compare vendors and ask the concierge to rebalance when plans change.",
  },
];

const PRINCIPLES = [
  {
    title: "Maths you can trust",
    body: "AI suggests percentages and priorities. Every rupee is calculated by Festa's own code, never by the model.",
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
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
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
        <section className="mx-auto max-w-6xl px-5 pt-16 text-center sm:px-6 sm:pt-24">
          <p className="type-eyebrow">The AI celebration planner</p>
          <h1 className="type-display mx-auto mt-5 max-w-4xl text-[3.4rem] sm:text-[5.25rem] lg:text-[6.5rem]">
            Make room for <em className="text-sage-strong">moments</em>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-muted-foreground sm:text-[1.1875rem]">
            Festa turns a few answers into a complete plan for weddings, birthdays, engagements and community
            events — then keeps your budget, timeline, vendors and ideas in sync as it takes shape.
          </p>
          <div className="mt-9">
            <HeroActions />
          </div>
          <p className="mt-5 text-[0.8125rem] text-muted-foreground">
            Free to use · Private by default · Works even when AI is offline
          </p>
        </section>

        <section aria-label="Product preview" className="mx-auto mt-14 max-w-6xl px-5 sm:mt-20 sm:px-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[var(--shadow-lifted)] sm:aspect-[16/9]">
            <Image
              src={unsplashUrl(HERO_IMAGES.primary, 1800)}
              alt="A wedding mandap decorated with marigolds and white flowers under a chandelier"
              fill
              priority
              sizes="(min-width: 1152px) 1104px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgb(32_33_31/0.45)] via-transparent to-transparent" />

            <div className="absolute bottom-4 left-4 w-[min(19rem,calc(100%-2rem))] rounded-3xl bg-[rgb(255_254_251/0.9)] p-5 text-left shadow-[var(--shadow-soft)] backdrop-blur-xl sm:bottom-8 sm:left-8">
              <p className="type-eyebrow">Budget</p>
              <p className="tabular mt-1.5 text-[1.75rem] font-medium tracking-[-0.02em]">₹1,52,400</p>
              <p className="text-[0.8125rem] text-muted-foreground">committed of ₹2,00,000</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ebe6dc]">
                <div className="h-full w-[76%] rounded-full bg-charcoal" />
              </div>
            </div>

            <div className="absolute top-4 right-4 hidden w-64 rounded-3xl bg-[rgb(255_254_251/0.9)] p-5 text-left shadow-[var(--shadow-soft)] backdrop-blur-xl sm:top-8 sm:right-8 sm:block">
              <p className="type-eyebrow">Next up</p>
              <p className="mt-1.5 text-[0.9375rem] font-medium">Book the caterer and schedule a tasting</p>
              <p className="mt-1 text-[0.8125rem] text-warning">Due in 12 days</p>
            </div>

            <div className="absolute right-4 bottom-4 hidden rounded-3xl bg-[rgb(255_254_251/0.9)] p-4 shadow-[var(--shadow-soft)] backdrop-blur-xl md:right-8 md:bottom-8 md:block">
              <p className="type-eyebrow">Heritage festive</p>
              <div className="mt-2.5 flex gap-1.5">
                {["#E9A23B", "#C2452D", "#5E7458", "#B08D57", "#F8F6F1"].map((hex) => (
                  <span
                    key={hex}
                    className="size-7 rounded-full ring-1 ring-black/5"
                    style={{ background: hex }}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[0.75rem] text-muted-foreground">
            Preview shown with sample data.
          </p>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 sm:px-6 sm:py-32">
          <div className="max-w-2xl">
            <p className="type-eyebrow">Features</p>
            <h2 className="type-display mt-4 text-[2.75rem] sm:text-[3.75rem]">
              Everything a celebration needs. Nothing it doesn&rsquo;t.
            </h2>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-6">
            <article className="surface relative overflow-hidden md:col-span-4">
              <div className="grid h-full sm:grid-cols-2">
                <div className="p-7 sm:p-9">
                  <span className="grid size-11 place-items-center rounded-full bg-sage-soft text-sage-strong">
                    <Sparkles className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="type-title mt-6 text-[2rem]">An AI blueprint in seconds</h3>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
                    Answer a short, skippable brief. Festa returns a concept and palette, a budget split, a
                    checklist with real deadlines, vendors to book and risks to plan around — validated before
                    it ever reaches your plan.
                  </p>
                </div>
                <div className="relative min-h-60">
                  <Image
                    src={unsplashUrl(HERO_IMAGES.table, 900)}
                    alt="A candlelit table with colourful floral centrepieces"
                    fill
                    sizes="(min-width: 768px) 360px, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </article>

            <article className="surface flex flex-col justify-between p-7 sm:p-9 md:col-span-2">
              <div>
                <span className="grid size-11 place-items-center rounded-full bg-blush-soft text-blush-strong">
                  <MessagesSquare className="size-5" aria-hidden="true" />
                </span>
                <h3 className="type-title mt-6 text-[2rem]">A concierge that asks first</h3>
              </div>
              <div className="mt-8 grid gap-2 text-[0.8125rem]">
                <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-charcoal px-4 py-2.5 text-ivory">
                  Our budget dropped to ₹1,60,000.
                </p>
                <p className="max-w-[90%] rounded-2xl rounded-bl-md bg-secondary px-4 py-2.5">
                  Here&rsquo;s a version that fits. Confirmed costs stay; 6 changes are ready for your review.
                </p>
              </div>
            </article>

            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="surface p-7 md:col-span-3 lg:col-span-3 xl:col-span-3">
                <span className="grid size-11 place-items-center rounded-full bg-sand-soft text-sand-strong">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="type-title mt-6 text-[1.75rem]">{title}</h3>
                <p className="mt-2.5 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-20 border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:px-6 sm:py-28">
            <p className="type-eyebrow">How it works</p>
            <h2 className="type-display mt-4 max-w-2xl text-[2.75rem] sm:text-[3.5rem]">
              From first idea to final toast.
            </h2>
            <ol className="mt-14 grid gap-10 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <span className="type-display text-[3rem] text-sand-strong">{index + 1}</span>
                  <h3 className="mt-3 text-[1.0625rem] font-medium">{step.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="principles" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 sm:px-6 sm:py-32">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <span className="grid size-11 place-items-center rounded-full bg-sage-soft text-sage-strong">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <h2 className="type-display mt-6 text-[2.75rem] sm:text-[3.5rem]">Honest by design.</h2>
              <p className="mt-4 max-w-md text-[1rem] leading-relaxed text-muted-foreground">
                Planning a celebration means trusting the numbers. Festa keeps AI in the role of a thoughtful
                assistant and leaves the decisions — and the arithmetic — where they belong.
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
          <div className="relative overflow-hidden rounded-[2rem] bg-charcoal px-6 py-16 text-center text-ivory sm:px-12 sm:py-20">
            <h2 className="type-display mx-auto max-w-2xl text-[2.5rem] sm:text-[3.5rem]">
              Your next celebration starts here.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[1rem] text-[#d9d4c9]">
              Create a free account, or open the demo to explore a sample engagement in Jaipur.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/sign-in?mode=sign-up"
                className="inline-flex h-12 items-center justify-center rounded-full bg-ivory px-6 text-[0.9375rem] font-medium text-charcoal transition-transform active:scale-[0.97]"
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
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-[0.8125rem] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <FestaLogo className="opacity-80" />
          <p>Built for PromptWars Virtual · Photography from Unsplash</p>
        </div>
      </footer>
    </>
  );
}
