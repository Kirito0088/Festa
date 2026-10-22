"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, useSyncExternalStore, type ReactNode } from "react";
import { Bunting } from "@/components/ui/bunting";
import { CountdownStamp, Stamp } from "@/components/ui/stamp";

/*
 * Festa's story, told through the demo's sample celebration. One sticky
 * stage; scroll progress (0 to 1) drives every layer through transform and
 * opacity only, which Motion hands to the browser's ScrollTimeline where it
 * can. People who prefer reduced motion get the same beats as still frames.
 */

const PALETTE = ["#E9A238", "#C2452D", "#5E7458", "#B08D57", "#F8F6F1"];
const VERMILION = "#C2452D";

type Beat = { title: string; body: string; from: number; to: number; frame: number };

const BEATS: Beat[] = [
  {
    title: "It usually starts like this.",
    body: "Three family WhatsApp groups, a caterer who'll call back, and a budget that lives in someone's head.",
    from: 0,
    to: 0.14,
    frame: 0.04,
  },
  {
    title: "Festa starts with a few questions.",
    body: "What, when, where, how many, how much, and how it should feel. Skip anything you haven't decided yet.",
    from: 0.17,
    to: 0.36,
    frame: 0.34,
  },
  {
    title: "Then it sketches the plan.",
    body: "A concept, a palette and a budget split in seconds. The AI suggests; Festa's own code does the maths.",
    from: 0.39,
    to: 0.54,
    frame: 0.53,
  },
  {
    title: "Everything finds its place.",
    body: "Each task gets a date counted back from the day. Quotes sit side by side, and booked is booked.",
    from: 0.57,
    to: 0.72,
    frame: 0.71,
  },
  {
    title: "Plans change. That's fine.",
    body: "Tell the concierge the budget dropped. It proposes edits, shows the numbers and waits for your yes.",
    from: 0.75,
    to: 0.9,
    frame: 0.895,
  },
  {
    title: "Meera and Kabir are ready. Are you?",
    body: "Their engagement is the demo. Open it and change anything, or start your own plan from scratch.",
    from: 0.93,
    to: 1,
    frame: 1,
  },
];

const noSubscription = () => () => {};

export function Story({ children }: { children?: ReactNode }) {
  const reduce = useReducedMotion();
  // The static HTML is the scrolling version; switch to still frames only
  // after hydration, so the markup matches what the server sent.
  const hydrated = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  return reduce && hydrated ? <StillStory>{children}</StillStory> : <ScrollStory>{children}</ScrollStory>;
}

function ScrollStory({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section
      id="story"
      ref={ref}
      aria-label="How Festa plans a celebration"
      className="relative h-[560vh] overflow-x-clip"
    >
      <div className="sticky top-16 mx-auto flex h-[calc(100svh-4rem)] max-w-6xl flex-col gap-4 px-5 pt-6 pb-5 sm:px-6 md:flex-row md:items-center md:gap-12 md:py-0">
        <div className="relative min-h-[12.5rem] shrink-0 md:min-h-0 md:w-[22rem] md:self-stretch">
          {BEATS.map((beat, index) => (
            <Narration key={beat.title} beat={beat} p={scrollYProgress} last={index === BEATS.length - 1}>
              {index === BEATS.length - 1 && children}
            </Narration>
          ))}
        </div>
        <Stage p={scrollYProgress} className="min-h-0 flex-1 md:h-[min(36rem,80%)]" />
      </div>
    </section>
  );
}

function StillStory({ children }: { children?: ReactNode }) {
  return (
    <section id="story" aria-label="How Festa plans a celebration" className="mx-auto max-w-6xl px-5 sm:px-6">
      <ol className="grid gap-16 py-10">
        {BEATS.map((beat, index) => (
          <li key={beat.title} className="grid items-center gap-6 md:grid-cols-[22rem_1fr] md:gap-12">
            <div>
              <h2 className="type-display text-[2.25rem] sm:text-[2.75rem]">{beat.title}</h2>
              <p className="mt-3 max-w-sm text-[1rem] leading-relaxed text-muted-foreground">{beat.body}</p>
              {index === BEATS.length - 1 && <div className="mt-7">{children}</div>}
            </div>
            <StillFrame at={beat.frame} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function StillFrame({ at }: { at: number }) {
  const p = useMotionValue(at);
  return <Stage p={p} className="h-[32rem]" />;
}

function Narration({
  beat,
  p,
  last,
  children,
}: {
  beat: Beat;
  p: MotionValue<number>;
  last: boolean;
  children?: ReactNode;
}) {
  // Scroll-linked keyframes run on the browser's ScrollTimeline, whose
  // offsets must stay within 0 to 1: the first beat starts shown and the
  // last one stays shown instead of using out-of-range stops.
  const first = beat.from === 0;
  const input = [
    ...(first ? [0] : [beat.from - 0.005, beat.from + 0.02]),
    ...(last ? [1] : [beat.to - 0.02, beat.to + 0.005]),
  ];
  const shown = [...(first ? [1] : [0, 1]), ...(last ? [1] : [1, 0])];
  const lift = [...(first ? [0] : [28, 0]), ...(last ? [0] : [0, -28])];
  const opacity = useTransform(p, input, shown);
  const y = useTransform(p, input, lift);
  // Hidden beats must not catch taps meant for the visible one.
  const pointerEvents = useTransform(opacity, (value) => (value > 0.5 ? "auto" : "none"));

  return (
    <motion.div
      style={{ opacity, y, pointerEvents }}
      className="absolute inset-x-0 top-0 md:top-1/2 md:-translate-y-1/2"
    >
      <h2 className="type-display text-[2rem] sm:text-[2.75rem] md:text-[3.25rem]">{beat.title}</h2>
      <p className="mt-3 max-w-sm text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-[1.0625rem]">
        {beat.body}
      </p>
      {children && <div className="mt-6">{children}</div>}
    </motion.div>
  );
}

/** The illustrated stage. Decorative: the narration carries the story. */
function Stage({ p, className }: { p: MotionValue<number>; className?: string }) {
  return (
    <div className={`pointer-events-none relative w-full select-none ${className ?? ""}`} aria-hidden="true">
      <Scraps p={p} />
      <Questions p={p} />
      <Plan p={p} />
    </div>
  );
}

/* Beat 1: the mess. */

const SCRAPS: {
  left: string;
  top: string;
  rotate: number;
  kind: "note" | "chat" | "receipt" | "list";
  text: ReactNode;
}[] = [
  { left: "3%", top: "4%", rotate: -6, kind: "note", text: "Caterer quote?? Call back Tuesday" },
  {
    left: "47%",
    top: "2%",
    rotate: 3,
    kind: "chat",
    text: (
      <>
        <b>Mummy</b>: Kabir&rsquo;s side is adding 40 more people
      </>
    ),
  },
  { left: "56%", top: "30%", rotate: 7, kind: "note", text: "Venue: book by October!!" },
  {
    left: "6%",
    top: "35%",
    rotate: -3,
    kind: "receipt",
    text: (
      <>
        Decor advance
        <br />
        ₹15,000
      </>
    ),
  },
  { left: "26%", top: "60%", rotate: -2, kind: "chat", text: "Is it the 5th or the 12th?" },
  { left: "60%", top: "63%", rotate: 5, kind: "note", text: "Budget: 2 lakh? 2.5?" },
  {
    left: "4%",
    top: "76%",
    rotate: 4,
    kind: "list",
    text: (
      <>
        Mehendi artist
        <br />
        Photographer
        <br />
        Sweets for 120 guests
      </>
    ),
  },
];

const SCRAP_STYLE = {
  note: "bg-marigold-soft shadow-[0_8px_18px_-10px_rgb(38_42_71/0.35)]",
  chat: "rounded-2xl rounded-bl-sm bg-[#e4ecdc] shadow-[0_6px_16px_-10px_rgb(38_42_71/0.35)]",
  receipt: "bg-card font-mono text-[0.75rem] shadow-[0_8px_18px_-10px_rgb(38_42_71/0.35)] ring-1 ring-border",
  list: "bg-card shadow-[0_8px_18px_-10px_rgb(38_42_71/0.35)] ring-1 ring-border [background-image:repeating-linear-gradient(transparent_0_1.35rem,rgb(38_42_71/0.08)_1.35rem_calc(1.35rem+1px))]",
} as const;

function Scraps({ p }: { p: MotionValue<number> }) {
  return (
    <>
      {SCRAPS.map((scrap, index) => (
        <Scrap key={index} index={index} p={p} {...scrap} />
      ))}
    </>
  );
}

function Scrap({
  index,
  p,
  left,
  top,
  rotate,
  kind,
  text,
}: (typeof SCRAPS)[number] & { index: number; p: MotionValue<number> }) {
  // Each scrap is swept off the desk a little after the one before it.
  const start = 0.09 + index * 0.012;
  const range = [start, start + 0.08];
  const side = parseFloat(left) < 40 ? -1 : 1;
  const opacity = useTransform(p, range, [1, 0]);
  const x = useTransform(p, range, [0, side * 70]);
  const y = useTransform(p, range, [0, -90 - index * 10]);
  const turn = useTransform(p, range, [rotate, rotate + side * 16]);

  return (
    <motion.div
      style={{ left, top, opacity, x, y, rotate: turn }}
      className={`absolute w-[42%] max-w-[13rem] px-3.5 py-3 text-[0.8125rem] leading-snug ${SCRAP_STYLE[kind]}`}
    >
      {kind === "note" && (
        <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rotate-2 bg-[rgb(255_255_255/0.6)] shadow-sm" />
      )}
      {text}
    </motion.div>
  );
}

/* Beat 2: the questions. */

const ANSWERS: [string, string][] = [
  ["What are we celebrating?", "An engagement"],
  ["When?", "Tuesday, 5 January"],
  ["Where?", "A heritage haveli in Jaipur"],
  ["How many guests?", "120"],
  ["What's the budget?", "₹2,00,000"],
  ["How should it feel?", "Warm, traditional, unhurried"],
];

function Questions({ p }: { p: MotionValue<number> }) {
  const opacity = useTransform(p, [0.15, 0.2, 0.36, 0.41], [0, 1, 1, 0]);
  const y = useTransform(p, [0.15, 0.2, 0.36, 0.41], [30, 0, 0, -30]);
  const scale = useTransform(p, [0.36, 0.41], [1, 0.94]);

  return (
    <motion.div style={{ opacity, y, scale }} className="absolute inset-0 grid place-items-center">
      <div className="surface w-[min(94%,24rem)] p-5 sm:p-6">
        <p className="type-eyebrow">A few questions</p>
        <dl className="mt-3 grid gap-2.5">
          {ANSWERS.map(([question, answer], index) => (
            <Answer key={question} index={index} p={p} question={question} answer={answer} />
          ))}
        </dl>
      </div>
    </motion.div>
  );
}

function Answer({
  index,
  p,
  question,
  answer,
}: {
  index: number;
  p: MotionValue<number>;
  question: string;
  answer: string;
}) {
  const start = 0.2 + index * 0.022;
  const opacity = useTransform(p, [start, start + 0.02], [0, 1]);
  const x = useTransform(p, [start, start + 0.02], [-14, 0]);
  return (
    <motion.div
      style={{ opacity, x }}
      className="flex items-baseline justify-between gap-3 border-b border-dashed border-border pb-2 last:border-0 last:pb-0"
    >
      <dt className="text-[0.8125rem] text-muted-foreground">{question}</dt>
      <dd className="type-title text-right text-[1.0625rem] italic">{answer}</dd>
    </motion.div>
  );
}

/* Beats 3 to 6: the plan, its details, a change and the finale. */

const LINES: { label: string; before: number; after: number; kept?: boolean }[] = [
  { label: "Venue", before: 42000, after: 42000, kept: true },
  { label: "Catering", before: 66000, after: 52000 },
  { label: "Decor", before: 28000, after: 18000 },
  { label: "Photography", before: 20000, after: 16000 },
];
const LINE_MAX = 70000;

const TASKS: [string, string][] = [
  ["Book venue", "22 Oct"],
  ["Menu tasting", "6 Nov"],
  ["Invitations", "6 Dec"],
];

const inr = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

function Plan({ p }: { p: MotionValue<number> }) {
  // The card arrives, then rises and shrinks to make room for the details.
  const cardOpacity = useTransform(p, [0.38, 0.45, 0.74, 0.77, 0.9, 0.93], [0, 1, 1, 0.18, 0.18, 1]);
  const cardScale = useTransform(p, [0.38, 0.45, 0.56, 0.62], [0.88, 1, 1, 0.76]);
  const cardLift = useTransform(p, [0.56, 0.62], ["0%", "-21%"]);
  const cardIn = useTransform(p, [0.38, 0.45], [40, 0]);
  const buntingY = useTransform(p, [0.42, 0.48], [-24, 0]);
  const buntingOpacity = useTransform(p, [0.42, 0.47], [0, 1]);
  const stampScale = useTransform(p, [0.48, 0.52], [1.7, 1]);
  const stampOpacity = useTransform(p, [0.48, 0.5], [0, 1]);

  return (
    <>
      <motion.div style={{ y: cardLift }} className="absolute inset-0 grid place-items-center">
        <motion.div
          style={{ opacity: cardOpacity, scale: cardScale, y: cardIn }}
          className="surface relative w-[min(82%,19rem)] overflow-hidden"
        >
          <span className="absolute inset-[7px] rounded-[1.05rem] border border-[rgb(38_42_71/0.1)]" />
          <motion.div style={{ y: buntingY, opacity: buntingOpacity }}>
            <Bunting colors={PALETTE} flags={10} className="-mt-1 px-2" />
          </motion.div>
          <div className="flex flex-col items-center px-6 pt-2 pb-6 text-center">
            <p className="type-eyebrow">Engagement</p>
            <p className="type-display mt-1.5 text-[1.875rem]">Meera &amp; Kabir</p>
            <p className="type-title mt-1 text-[1rem] italic text-muted-foreground">
              A traditional engagement in Jaipur
            </p>
            <div className="mt-4 flex gap-1.5">
              {PALETTE.map((hex) => (
                <span
                  key={hex}
                  className="size-5 rounded-full ring-1 ring-black/10"
                  style={{ background: hex }}
                />
              ))}
            </div>
            <p className="mt-4 text-[0.875rem]">Tuesday, 5 January 2027</p>
            <p className="text-[0.8125rem] text-muted-foreground">Heritage haveli, Jaipur</p>
          </div>
          <motion.div
            style={{ scale: stampScale, opacity: stampOpacity }}
            className="absolute right-2 bottom-2"
          >
            <CountdownStamp color={VERMILION} days={75} isToday={false} isPast={false} size="sm" />
          </motion.div>
        </motion.div>
      </motion.div>
      <Details p={p} />
      <Chat p={p} />
      <Finale p={p} />
    </>
  );
}

function Details({ p }: { p: MotionValue<number> }) {
  const opacity = useTransform(p, [0.58, 0.63], [0, 1]);
  const y = useTransform(p, [0.58, 0.63], [40, 0]);
  const beforeTotal = useTransform(p, [0.84, 0.86], [1, 0]);
  const afterTotal = useTransform(p, [0.84, 0.86], [0, 1]);
  const bookedScale = useTransform(p, [0.66, 0.69], [1.6, 1]);
  const bookedOpacity = useTransform(p, [0.66, 0.675], [0, 1]);

  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-0 bottom-0 grid grid-cols-2 gap-3">
      <div className="surface relative min-w-0 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[0.8125rem] font-medium">Budget</p>
          <span className="tabular relative text-[0.8125rem] text-muted-foreground">
            <motion.span style={{ opacity: beforeTotal }}>{inr(200000)}</motion.span>
            <motion.span
              style={{ opacity: afterTotal }}
              className="absolute right-0 font-medium text-foreground"
            >
              {inr(160000)}
            </motion.span>
          </span>
        </div>
        <ul className="mt-3 grid gap-2.5">
          {LINES.map((line, index) => (
            <BudgetLine key={line.label} index={index} p={p} {...line} />
          ))}
        </ul>
      </div>
      <div className="surface relative min-w-0 p-4">
        <p className="text-[0.8125rem] font-medium">Checklist</p>
        <ul className="mt-3 grid gap-2.5">
          {TASKS.map(([task, due], index) => (
            <TaskTick key={task} index={index} p={p} task={task} due={due} />
          ))}
        </ul>
        <motion.div
          style={{ scale: bookedScale, opacity: bookedOpacity }}
          className="absolute -top-14 right-2"
        >
          <Stamp color="#56694f" className="size-[4.5rem] bg-card/85">
            <span className="type-title text-[1rem] italic">Booked</span>
            <span className="text-[0.625rem] font-medium">the haveli</span>
          </Stamp>
        </motion.div>
      </div>
    </motion.div>
  );
}

function BudgetLine({
  index,
  p,
  label,
  before,
  after,
  kept,
}: (typeof LINES)[number] & { index: number; p: MotionValue<number> }) {
  const start = 0.6 + index * 0.012;
  const scaleX = useTransform(
    p,
    [start, start + 0.04, 0.84, 0.89],
    [0, before / LINE_MAX, before / LINE_MAX, after / LINE_MAX],
  );
  const beforeOpacity = useTransform(p, [0.85, 0.87], [1, 0]);
  const afterOpacity = useTransform(p, [0.85, 0.87], [0, 1]);
  return (
    <li className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-[0.75rem]">
        <span className="truncate">{label}</span>
        <span className="tabular relative shrink-0 text-muted-foreground">
          <motion.span style={{ opacity: beforeOpacity }}>{inr(before)}</motion.span>
          <motion.span style={{ opacity: afterOpacity }} className="absolute right-0 whitespace-nowrap">
            {kept ? "kept" : inr(after)}
          </motion.span>
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#ebe6dc]">
        <motion.div style={{ scaleX }} className="h-full origin-left rounded-full bg-marigold" />
      </div>
    </li>
  );
}

function TaskTick({
  index,
  p,
  task,
  due,
}: {
  index: number;
  p: MotionValue<number>;
  task: string;
  due: string;
}) {
  const start = 0.62 + index * 0.018;
  const fill = useTransform(p, [start, start + 0.015], [0, 1]);
  const draw = useTransform(p, [start + 0.005, start + 0.02], [0, 1]);
  const opacity = useTransform(p, [start - 0.02, start], [0.35, 1]);
  return (
    <motion.li style={{ opacity }} className="flex items-center gap-2 text-[0.75rem]">
      <span className="relative grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] border-input">
        <motion.span
          style={{ opacity: fill }}
          className="absolute -inset-[1.5px] rounded-full bg-sage-strong"
        />
        <svg viewBox="0 0 16 16" className="relative size-2.5">
          <motion.path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            fill="none"
            stroke="var(--ivory)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength: draw }}
          />
        </svg>
      </span>
      <span className="min-w-0 flex-1 truncate">{task}</span>
      <span className="shrink-0 text-muted-foreground">{due}</span>
    </motion.li>
  );
}

function Chat({ p }: { p: MotionValue<number> }) {
  const askOpacity = useTransform(p, [0.75, 0.78, 0.9, 0.93], [0, 1, 1, 0]);
  const askY = useTransform(p, [0.75, 0.78], [18, 0]);
  const replyOpacity = useTransform(p, [0.79, 0.82, 0.9, 0.93], [0, 1, 1, 0]);
  const replyY = useTransform(p, [0.79, 0.82], [18, 0]);
  const appliedOpacity = useTransform(p, [0.83, 0.85, 0.9, 0.93], [0, 1, 1, 0]);

  return (
    <div className="absolute inset-x-0 top-[2%] grid gap-2.5 text-[0.875rem]">
      <motion.p
        style={{ opacity: askOpacity, y: askY }}
        className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-ink px-4 py-2.5 text-ivory"
      >
        Our budget dropped to ₹1,60,000. Can we still make it work?
      </motion.p>
      <motion.div
        style={{ opacity: replyOpacity, y: replyY }}
        className="surface max-w-[88%] rounded-2xl rounded-bl-sm px-4 py-3"
      >
        <p>
          Yes. The venue is confirmed, so it stays. I&rsquo;d trim catering, decor and photography. Three
          changes are ready for you.
        </p>
        <motion.p style={{ opacity: appliedOpacity }} className="type-eyebrow mt-2 text-sage-strong">
          Approved and applied
        </motion.p>
      </motion.div>
    </div>
  );
}

const CONFETTI = ["var(--marigold)", "var(--blush-strong)", "var(--sage-strong)", "var(--sand)", "#C2452D"];

function Finale({ p }: { p: MotionValue<number> }) {
  return (
    <div className="absolute inset-x-0 top-[23%] grid place-items-center">
      {Array.from({ length: 18 }, (_, i) => (
        <Piece key={i} index={i} p={p} />
      ))}
    </div>
  );
}

function Piece({ index, p }: { index: number; p: MotionValue<number> }) {
  const angle = (index / 18) * Math.PI * 2;
  const distance = 120 + (index % 4) * 26;
  const opacity = useTransform(p, [0.93, 0.95, 1], [0, 1, 0.85]);
  const x = useTransform(p, [0.93, 1], [0, Math.cos(angle) * distance]);
  const y = useTransform(p, [0.93, 1], [0, Math.sin(angle) * distance * 0.7 + 20]);
  const rotate = useTransform(p, [0.93, 1], [0, (index % 2 ? 1 : -1) * 260]);
  return (
    <motion.span
      style={{ opacity, x, y, rotate, background: CONFETTI[index % CONFETTI.length] }}
      className="absolute block h-2.5 w-1.5 rounded-[1px]"
    />
  );
}
