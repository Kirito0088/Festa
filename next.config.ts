import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/** Origins the browser may talk to: the Convex deployment (HTTPS + WebSocket). */
function convexOrigins(): string[] {
  const origins: string[] = [];
  for (const value of [process.env.NEXT_PUBLIC_CONVEX_URL, process.env.NEXT_PUBLIC_CONVEX_SITE_URL]) {
    if (!value) continue;
    try {
      const url = new URL(value);
      origins.push(url.origin);
      origins.push(`${url.protocol === "https:" ? "wss:" : "ws:"}//${url.host}`);
    } catch {
      // Ignore malformed values; the app will fail loudly elsewhere.
    }
  }
  return origins;
}

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Moodboard items may come from any https image host the user chooses.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${convexOrigins().join(" ")}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
