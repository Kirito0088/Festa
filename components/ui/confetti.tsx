"use client";

import { motion, useReducedMotion } from "motion/react";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

const COLORS = [
  "var(--marigold)",
  "var(--blush-strong)",
  "var(--sage-strong)",
  "var(--sand)",
  "var(--blush)",
];
const PIECES = 14;
const LIFETIME_MS = 900;

type Burst = { id: number; x: number; y: number };

const ConfettiContext = createContext<(target: Element) => void>(() => {});

/**
 * Hosts the app's confetti in one fixed layer, so a burst outlives the
 * element that triggered it (a finished task moves to another list, for
 * example). Does nothing when the person prefers reduced motion.
 */
export function ConfettiProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const nextId = useRef(0);

  const celebrate = useCallback(
    (target: Element) => {
      if (reduce) return;
      const rect = target.getBoundingClientRect();
      const id = ++nextId.current;
      setBursts((all) => [...all, { id, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }]);
      window.setTimeout(() => setBursts((all) => all.filter((burst) => burst.id !== id)), LIFETIME_MS);
    },
    [reduce],
  );

  return (
    <ConfettiContext.Provider value={celebrate}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true">
        {bursts.map((burst) => (
          <span key={burst.id} className="absolute" style={{ left: burst.x, top: burst.y }}>
            {Array.from({ length: PIECES }, (_, i) => {
              // Deterministic spread per piece; the burst id varies it between bursts.
              const angle = (i / PIECES) * Math.PI * 2 + burst.id * 0.7;
              const distance = 22 + ((i * 7 + burst.id) % 5) * 5;
              return (
                <motion.span
                  key={i}
                  className="absolute -mt-[3px] -ml-[2px] block h-1.5 w-1 rounded-[1px]"
                  style={{ background: COLORS[i % COLORS.length] }}
                  initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance + 10,
                    opacity: 0,
                    rotate: (i % 2 ? 1 : -1) * 220,
                  }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                />
              );
            })}
          </span>
        ))}
      </div>
    </ConfettiContext.Provider>
  );
}

/** Returns `celebrate(element)`: a small burst of confetti from that element. */
export function useConfetti() {
  return useContext(ConfettiContext);
}
