import { describe, expect, it } from "vitest";
import { fadeRise, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

describe("utils cn", () => {
  it("combines class names and handles conditionals", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
    expect(cn("base", false && "hidden", "active")).toBe("base active");
    expect(cn("p-4", undefined, null, "text-center")).toBe("p-4 text-center");
  });
});

describe("motion presets", () => {
  it("defines standard spring animations", () => {
    expect(spring.default).toMatchObject({ type: "spring", bounce: 0, duration: 0.4 });
    expect(spring.snappy).toMatchObject({ type: "spring", bounce: 0, duration: 0.28 });
    expect(spring.momentum).toMatchObject({ type: "spring", bounce: 0.2, duration: 0.45 });
  });

  it("defines fadeRise transition states", () => {
    expect(fadeRise.initial).toEqual({ opacity: 0, y: 8 });
    expect(fadeRise.animate).toEqual({ opacity: 1, y: 0 });
    expect(fadeRise.exit).toEqual({ opacity: 0, y: 8 });
  });
});
