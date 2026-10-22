# 5. The content security policy allows inline scripts

Status: accepted (2026-10-22)

## Context

`next.config.ts` sends a strict CSP: `default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, an explicit `connect-src` for the Convex deployment, and HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and COOP headers. Next.js streams inline scripts for hydration. A nonce-based policy removes `'unsafe-inline'`, but Next can only add nonces to dynamically rendered pages.

## Decision

Keep `script-src 'self' 'unsafe-inline'`. Festa's landing, sign-in and wizard pages are static, and the event pages are Partial Prerender with static shells; nonces would make every page dynamic, slower and costlier to serve.

## Consequences

- The remaining risk is script injection through rendered content. React escapes all rendered text, no component uses `dangerouslySetInnerHTML`, and user-supplied image URLs are restricted to `https:`.
- Revisit if Next.js adds hash-based CSP for prerendered pages.
