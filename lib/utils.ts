import { cn as clsxCn } from "cn";

/**
 * Merges CSS class names, resolving Tailwind class conflicts.
 *
 * @param inputs - Class values, objects, or arrays to merge.
 * @returns Combined and deduped class name string.
 */
export function cn(...inputs: Parameters<typeof clsxCn>): string {
  return clsxCn(...inputs);
}
