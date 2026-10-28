import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { errorMessage } from "@/lib/errors";

describe("errorMessage", () => {
  it("surfaces string data from a ConvexError", () => {
    const err = new ConvexError("Specific validation failure");
    expect(errorMessage(err)).toBe("Specific validation failure");
  });

  it("extracts message property from object data in a ConvexError", () => {
    const err = new ConvexError({ code: "NOT_FOUND", message: "That celebration could not be found." });
    expect(errorMessage(err)).toBe("That celebration could not be found.");
  });

  it("falls back to default message when ConvexError has unexpected data shape", () => {
    const errNumber = new ConvexError(404);
    expect(errorMessage(errNumber)).toBe("Something went wrong. Please try again.");

    const errNull = new ConvexError(null);
    expect(errorMessage(errNull)).toBe("Something went wrong. Please try again.");

    const errEmptyObj = new ConvexError({});
    expect(errorMessage(errEmptyObj)).toBe("Something went wrong. Please try again.");

    const errNonStringMessage = new ConvexError({ message: 12345 });
    expect(errorMessage(errNonStringMessage)).toBe("Something went wrong. Please try again.");
  });

  it("sanitizes standard Javascript Error instances to prevent leaking internals", () => {
    const err = new Error("Database connection refused at 10.0.0.1:5432 with password secret");
    expect(errorMessage(err)).toBe("Something went wrong. Please try again.");
  });

  it("sanitizes thrown strings and primitive non-errors", () => {
    expect(errorMessage("uncaught thrown string")).toBe("Something went wrong. Please try again.");
    expect(errorMessage(undefined)).toBe("Something went wrong. Please try again.");
    expect(errorMessage(null)).toBe("Something went wrong. Please try again.");
    expect(errorMessage(500)).toBe("Something went wrong. Please try again.");
  });

  it("respects custom fallback messages", () => {
    const customFallback = "Could not update the schedule. Please refresh.";
    const standardError = new TypeError("Cannot read properties of undefined");
    expect(errorMessage(standardError, customFallback)).toBe(customFallback);

    const validConvex = new ConvexError({ message: "Explicit message" });
    expect(errorMessage(validConvex, customFallback)).toBe("Explicit message");
  });
});
