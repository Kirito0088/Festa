import { ImageResponse } from "next/og";
import { SITE_TAGLINE } from "@/lib/site";

export const alt = "Festa: plan the celebration, not the spreadsheet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FLAGS = ["#E9A238", "#C2452D", "#5E7458", "#B08D57", "#E9C7C3"];

/** The share card: bunting, the wordmark and the tagline, on paper. */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#F8F6F1",
        color: "#262A47",
        fontFamily: "Georgia, serif",
      }}
    >
      <svg width="1200" height="90" viewBox="0 0 1200 90" style={{ position: "absolute", top: 0, left: 0 }}>
        <path d="M0 8 Q600 72 1200 8" stroke="#262A47" strokeOpacity="0.35" strokeWidth="2" fill="none" />
        {Array.from({ length: 20 }, (_, i) => {
          const x = i * 60 + 30;
          const y = 8 + 32 * (1 - ((x - 600) / 600) ** 2);
          return (
            <polygon
              key={i}
              points={`${x - 26},${y} ${x + 26},${y} ${x},${y + 50 + (i % 3) * 6}`}
              fill={FLAGS[i % FLAGS.length]}
            />
          );
        })}
      </svg>
      <div style={{ fontSize: 132, letterSpacing: -3 }}>Festa</div>
      <div style={{ marginTop: 18, fontSize: 48, fontStyle: "italic", color: "#5A5953" }}>
        {`${SITE_TAGLINE}.`}
      </div>
      <div style={{ marginTop: 40, maxWidth: 860, textAlign: "center", fontSize: 30, color: "#64635F" }}>
        Your budget, timeline, vendors and ideas in one plan, with a concierge for when it changes
      </div>
    </div>,
    size,
  );
}
