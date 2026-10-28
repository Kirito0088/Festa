import { ConvexError } from "convex/values";

/**
 * Sanitizes thrown values into user-safe display messages.
 * Only messages deliberately raised by the server as `ConvexError` are surfaced;
 * all other exceptions become generic fallback sentences to prevent data leakage.
 *
 * @param error - The thrown exception or rejected value.
 * @param fallback - Default friendly error message.
 * @returns User-safe string message.
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
