import { cn } from "cn";

const FALLBACK = ["#E6A23C", "#E9C7C3", "#A7B5A0", "#D9C8AD"];
const FLAG_WIDTH = 40;
const SAG = 14;

/** A point on the string, a shallow parabola from edge to edge. */
function along(t: number, width: number) {
  return { x: t * width, y: 4 + SAG * 4 * t * (1 - t) };
}

/**
 * A strand of festive bunting in the celebration's own colours. Decorative:
 * hidden from assistive technology.
 */
export function Bunting({
  colors,
  flags = 15,
  className,
}: {
  colors: readonly string[];
  /** More flags for a wider strand; each flag keeps the same proportions. */
  flags?: number;
  className?: string;
}) {
  const palette = colors.length ? colors : FALLBACK;
  const width = flags * FLAG_WIDTH;
  const string = Array.from({ length: 41 }, (_, i) => along(i / 40, width));

  return (
    <svg
      viewBox={`0 0 ${width} 44`}
      className={cn("block h-auto w-full", className)}
      aria-hidden="true"
      focusable="false"
    >
      <polyline
        points={string.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
        fill="none"
        stroke="rgb(38 42 71 / 0.35)"
        strokeWidth="1.2"
      />
      {Array.from({ length: flags }, (_, i) => {
        const t = (i + 0.5) / flags;
        const left = along(t - 0.42 / flags, width);
        const right = along(t + 0.42 / flags, width);
        const tip = along(t, width);
        // Alternate lengths a little, as real bunting never hangs evenly.
        const drop = 22 + (i % 3) * 2;
        return (
          <path
            key={i}
            d={`M${left.x.toFixed(1)} ${left.y.toFixed(1)} L${right.x.toFixed(1)} ${right.y.toFixed(1)} L${tip.x.toFixed(1)} ${(tip.y + drop).toFixed(1)} Z`}
            fill={palette[i % palette.length]}
            stroke="rgb(38 42 71 / 0.12)"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}
