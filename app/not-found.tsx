import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FestaLogo } from "@/components/ui/festa-logo";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <FestaLogo />
      <p className="type-eyebrow mt-10">Page not found</p>
      <h1 className="type-display mt-3 text-[3rem]">This moment doesn&rsquo;t exist.</h1>
      <p className="mt-3 max-w-sm text-[0.9375rem] text-muted-foreground">
        The page may have moved, or the link may be incomplete.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/">Back to Festa</Link>
      </Button>
    </main>
  );
}
