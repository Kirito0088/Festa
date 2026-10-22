"use client";

import { cn } from "cn";
import { ImageOff } from "lucide-react";
import { useState } from "react";

/**
 * Remote image with a graceful fallback. User-supplied moodboard URLs can
 * point anywhere, so a plain <img> is used instead of next/image (which
 * requires an allow-list of hosts). No referrer is sent to third parties.
 */
export function SafeImage({
  src,
  alt,
  className,
  fallbackLabel = "Image unavailable",
  onLoad,
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  onLoad?: () => void;
  onError?: () => void;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  if (failedSrc === src) {
    return (
      <div
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        // The fallback's own layout goes last so a caller's `block` can't override it.
        className={cn(
          "bg-sand-soft text-sand-strong",
          className,
          "flex flex-col items-center justify-center gap-2 px-4 text-center",
        )}
      >
        <ImageOff className="size-5" aria-hidden="true" />
        <span className="text-xs">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied hosts
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={() => {
        setLoaded(true);
        onLoad?.();
      }}
      onError={() => {
        setFailedSrc(src);
        onError?.();
      }}
      className={cn(
        "bg-[#ece7dd] object-cover transition-opacity duration-500",
        loaded ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
