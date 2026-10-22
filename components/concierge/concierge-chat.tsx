"use client";

import { cn } from "cn";
import { useMutation, useQuery } from "convex/react";
import { ArrowUp, Cpu, Eraser, MessagesSquare, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useEventContext } from "@/components/events/event-context";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { currentIsoDate } from "@/hooks/use-today";
import { LIMITS } from "@/lib/constants";
import { errorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/money";
import { spring } from "@/lib/motion";
import { ProposalCard } from "./proposal-card";

function suggestionsFor(event: Doc<"events">): string[] {
  const reduced = Math.round((event.budget * 0.8) / 1000) * 1000;
  return [
    `Our budget has dropped from ${formatMoney(event.budget, event.currency)} to ${formatMoney(reduced, event.currency)}. Help me adjust the plan.`,
    `We're now expecting ${Math.max(10, Math.round(event.guestCount * 0.75))} guests instead of ${event.guestCount}.`,
    "What should I book first, and by when?",
    "Add the tasks we're missing for the final week.",
  ];
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="The concierge is thinking">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="size-1.5 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: index * 0.18, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

export function ConciergeChat() {
  const { event } = useEventContext();
  const messages = useQuery(api.concierge.list, { eventId: event._id });
  const items = useQuery(api.budget.list, { eventId: event._id });
  const tasks = useQuery(api.tasks.list, { eventId: event._id });
  const send = useMutation(api.concierge.send);
  const clear = useMutation(api.concierge.clear);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const waiting = messages?.some((message) => message.status === "pending") ?? false;
  const busy = sending || waiting;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages?.length, waiting]);

  async function submit(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setSending(true);
    try {
      await send({ eventId: event._id, content, today: currentIsoDate() });
      setDraft("");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  const loaded = messages !== undefined && items !== undefined && tasks !== undefined;

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="type-title text-[2rem]">Concierge</h2>
          <p className="mt-1 max-w-xl text-[0.875rem] text-muted-foreground">
            Ask for changes in plain words. The concierge reads your saved plan, explains the trade-offs and
            proposes edits — nothing changes until you approve.
          </p>
        </div>
        {messages && messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setClearOpen(true)} disabled={busy}>
            <Eraser aria-hidden="true" /> Clear
          </Button>
        )}
      </div>

      <section aria-label="Conversation" aria-live="polite" className="surface min-h-[22rem] p-4 sm:p-6">
        {!loaded ? (
          <div className="grid gap-4" aria-busy="true">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="ml-auto h-12 w-1/2" />
            <Skeleton className="h-24 w-4/5" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-sage-soft text-sage-strong">
              <MessagesSquare className="size-5" aria-hidden="true" />
            </span>
            <p className="type-title mt-5 text-2xl">How can I help with {event.name}?</p>
            <p className="mt-2 max-w-sm text-[0.875rem] text-muted-foreground">
              Try one of these, or write your own.
            </p>
          </div>
        ) : (
          <ol className="grid gap-5">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.li
                  key={message._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={spring.default}
                  className={cn("flex flex-col", message.role === "user" ? "items-end" : "items-start")}
                >
                  {message.role === "user" ? (
                    <p className="max-w-[85%] rounded-3xl rounded-br-lg bg-charcoal px-4 py-2.5 text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-ivory">
                      {message.content}
                    </p>
                  ) : (
                    <div className="w-full max-w-[92%]">
                      <div className="rounded-3xl rounded-bl-lg bg-secondary px-4 py-3 text-[0.9375rem] leading-relaxed">
                        {message.status === "pending" ? (
                          <TypingDots />
                        ) : (
                          <p
                            className={cn("whitespace-pre-wrap", message.status === "error" && "text-danger")}
                          >
                            {message.content}
                          </p>
                        )}
                      </div>
                      {message.status !== "pending" && message.engine && (
                        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 px-2 text-[0.6875rem] text-muted-foreground">
                          {message.engine === "ai" ? (
                            <Sparkles className="size-3" aria-hidden="true" />
                          ) : (
                            <Cpu className="size-3" aria-hidden="true" />
                          )}
                          {message.engine === "ai" ? "AI suggestion via Groq" : "Festa offline assistant"}
                          {message.notice && <span>· {message.notice}</span>}
                        </p>
                      )}
                      {message.proposal && (
                        <ProposalCard message={message} event={event} items={items} tasks={tasks} />
                      )}
                    </div>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        )}
        <div ref={endRef} />
      </section>

      {loaded && !busy && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested requests">
          {suggestionsFor(event).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submit(suggestion)}
              className="max-w-full cursor-pointer rounded-full border border-border bg-card px-4 py-2 text-left text-[0.8125rem] transition-[border-color,transform] hover:border-[#cfc6b6] active:scale-[0.98]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(formEvent) => {
          formEvent.preventDefault();
          void submit(draft);
        }}
        className="surface sticky bottom-4 flex items-end gap-2 p-2 pl-4"
      >
        <label htmlFor="concierge-input" className="sr-only">
          Message the concierge
        </label>
        <textarea
          id="concierge-input"
          ref={inputRef}
          rows={1}
          value={draft}
          maxLength={LIMITS.chatMessageMax}
          onChange={(changeEvent) => setDraft(changeEvent.target.value)}
          onKeyDown={(keyEvent) => {
            if (keyEvent.key === "Enter" && !keyEvent.shiftKey && !keyEvent.nativeEvent.isComposing) {
              keyEvent.preventDefault();
              void submit(draft);
            }
          }}
          placeholder={busy ? "The concierge is replying…" : "Ask for a change…"}
          className="field-sizing-content max-h-40 min-h-10 flex-1 resize-none bg-transparent py-2 text-[0.9375rem] outline-none placeholder:text-muted-foreground"
        />
        <Button type="submit" size="icon" aria-label="Send" disabled={busy || !draft.trim()}>
          <ArrowUp aria-hidden="true" />
        </Button>
      </form>

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear the conversation?"
        description="Messages and any unapplied proposals are removed. Changes you already applied stay in your plan."
        confirmLabel="Clear conversation"
        onConfirm={async () => {
          try {
            await clear({ eventId: event._id });
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
      />
    </div>
  );
}
