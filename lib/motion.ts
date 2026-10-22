import type { Transition } from "motion/react";

/**
 * Spring presets, expressed with Motion's `bounce` + `duration`, which map
 * to Apple's damping + response. Critically damped (no bounce) by default;
 * a little bounce only where a gesture carried momentum.
 */
export const spring = {
  /** Default UI motion: damping 1.0, response ~0.4s. */
  default: { type: "spring", bounce: 0, duration: 0.4 },
  /** Small, quick state changes: chips, toggles, indicators. */
  snappy: { type: "spring", bounce: 0, duration: 0.28 },
  /** After a flick or a drop: damping ~0.8. */
  momentum: { type: "spring", bounce: 0.2, duration: 0.45 },
} satisfies Record<string, Transition>;

/** Enter/exit along the same path: content rises in and settles back down. */
export const fadeRise = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};
