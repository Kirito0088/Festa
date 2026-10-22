import { ConvexError } from "convex/values";

/**
 * Turns any thrown value into a message that is safe to show. Only
 * messages the backend deliberately raised as `ConvexError` are surfaced;
 * everything else becomes a generic sentence so internals never leak.
 */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ConvexError) {
    const data: unknown = error.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
      return data.message;
    }
  }
  return fallback;
}
