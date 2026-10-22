"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useConvexAuth, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { DemoButton } from "@/components/auth/demo-button";
import { Button } from "@/components/ui/button";
import { Field, fieldAria } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";

const schema = z.object({
  name: z.string().trim().max(80, "Keep your name under 80 characters."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters.").max(128, "Use 128 characters or fewer."),
});

type Values = z.infer<typeof schema>;
type Flow = "signIn" | "signUp";

function safeNext(value: string | null): string {
  // Only allow same-site relative paths to avoid open redirects.
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/events";
}

function friendlyAuthError(error: unknown, flow: Flow): string {
  const text = error instanceof Error ? error.message : "";
  if (flow === "signUp" && /already exists/i.test(text)) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (/InvalidSecret|InvalidAccountId|Invalid credentials/i.test(text)) {
    return "That email and password don't match an account.";
  }
  if (/password/i.test(text) && flow === "signUp") return "Use a password between 8 and 128 characters.";
  return flow === "signIn"
    ? "That email and password don't match an account."
    : "We couldn't create your account. Please check your details and try again.";
}

export function SignInForm() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [flow, setFlow] = useState<Flow>(searchParams.get("mode") === "sign-up" ? "signUp" : "signIn");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  // Account holders go straight to their plans. Demo sessions stay here so
  // the demo button can finish seeding, or so they can create an account.
  useEffect(() => {
    if (me && !me.isDemo) router.replace(next);
  }, [me, next, router]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const fromDemo = me?.isDemo === true;
    try {
      await signIn("password", {
        email: values.email,
        password: values.password,
        flow,
        ...(flow === "signUp" && values.name ? { name: values.name } : {}),
      });
      // Switching straight from a demo session keeps the open client on the
      // demo identity, so load the next page fresh with the new account.
      if (fromDemo) window.location.assign(next);
    } catch (error) {
      setFormError(friendlyAuthError(error, flow));
    }
  });

  return (
    <div className="w-full">
      <Segmented
        label="Account"
        value={flow}
        onChange={(value) => {
          setFlow(value);
          setFormError(null);
        }}
        options={[
          { value: "signIn", label: "Sign in" },
          { value: "signUp", label: "Create account" },
        ]}
        className="w-full"
      />

      <form onSubmit={onSubmit} noValidate className="mt-7 grid gap-5">
        {flow === "signUp" && (
          <Field id="name" label="Your name" optional error={errors.name?.message}>
            <Input autoComplete="name" {...fieldAria("name", errors.name?.message)} {...register("name")} />
          </Field>
        )}
        <Field id="email" label="Email" error={errors.email?.message}>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            {...fieldAria("email", errors.email?.message)}
            {...register("email")}
          />
        </Field>
        <Field
          id="password"
          label="Password"
          error={errors.password?.message}
          hint={flow === "signUp" ? "At least 8 characters." : undefined}
        >
          <Input
            type="password"
            autoComplete={flow === "signUp" ? "new-password" : "current-password"}
            {...fieldAria("password", errors.password?.message, flow === "signUp")}
            {...register("password")}
          />
        </Field>

        {formError && (
          <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-[0.875rem] text-danger">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1 w-full">
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          {flow === "signIn" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <div className="my-7 flex items-center gap-4 text-[0.8125rem] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <DemoButton className="w-full" />
      <p className="mt-3 text-center text-[0.8125rem] leading-relaxed text-muted-foreground">
        The demo opens a private sample celebration. Sample vendors and prices are illustrative, not real
        businesses.
      </p>
    </div>
  );
}
