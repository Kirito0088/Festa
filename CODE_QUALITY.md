# Code Quality & Engineering Standards

This document establishes the code quality standards, architectural conventions, and automated quality gates enforced across Festa.

---

## 1. Core Principles

Festa adheres to rigorous software craftsmanship principles:

- **SOLID Principles:**
  - **Single Responsibility (SRP):** Each module in `lib/` and function in `convex/` addresses a single domain capability (e.g. `lib/budget.ts` manages budget arithmetic; `convex/tasks.ts` handles task lifecycle).
  - **Open/Closed (OCP):** Domain strategies like proposal evaluation and failure reporting (`describeFailure`) are easily extensible via discriminated union patterns without mutating established logic.
  - **Liskov Substitution (LSP):** Generic helpers (`sortTasks`, `uniqueBy`, `mergeReorder`) operate across all structural subtypes satisfying common minimal interfaces.
  - **Interface Segregation (ISP):** Components and functions consume only the precise subset of fields required (e.g., `TaskLike`, `BudgetLine`, `DueFields`).
  - **Dependency Inversion (DIP):** High-level modules depend on pure abstractions (`lib/constants.ts`, validator schemas) rather than platform specifics.

- **DRY (Don't Repeat Yourself):** Shared business logic (date formatting, currency math, input sanitization, error wrapping) lives in central, heavily-tested utilities in `lib/` and `convex/lib/`.
- **KISS & YAGNI:** No premature abstractions. Direct, explicit TypeScript code is prioritized over unnecessary indirection.

---

## 2. Type Safety & Invariant Guarantees

- **Zero `any` Policy:** The codebase enforces strict TypeScript (`strict: true`) with zero instances of the `any` keyword in application code.
- **Strict Null Checks:** Nullable fields (`null | undefined`) are explicitly modeled and checked using optional chaining (`?.`) and nullish coalescing (`??`).
- **Discriminated Unions:** State and mutation actions leverage discriminated unions for exhaustive type checking (e.g., `dueMode: "relative" | "fixed" | "none"`, `paymentStatus: "unpaid" | "deposit" | "paid"`).
- **Zod & Convex Validator Contracts:** All inputs across API boundaries and AI outputs are validated twice: client-side with Zod for immediate feedback, and server-side with Convex validators and `convex/lib/input.ts` for tamper-proof persistence.

---

## 3. Pure Functions & Deterministic Computation

- All computational domain code resides in `lib/` as pure, side-effect-free functions.
- **Financial Invariant:** Monetary calculations use integer minor units (paise/cents) through `toMinor()` and `fromMinor()` to prevent IEEE-754 floating-point drift.
- **Allocation Invariant:** Total budget splits always equal the user's target amount down to the exact rupee, solved deterministically using the Largest Remainder Method (`allocateByWeights`).

---

## 4. Error Handling & Security Boundaries

- **User-Safe Sanitization (`lib/errors.ts`):** Internal error details, stack traces, and database exceptions are never leaked to end users. Deliberately raised errors utilize `ConvexError` with actionable messages; all unexpected errors are masked into friendly, safe sentences.
- **Ownership Verification (`convex/lib/access.ts`):** Every mutation and query resolves the authenticated user from the session and confirms record ownership. Foreign or invalid IDs produce uniform "not found" responses to eliminate timing attacks and ID enumeration.
- **Input Sanitization (`convex/lib/input.ts`):** Strings are trimmed and length-bounded; URLs are verified for `https:` protocol and filtered against injection vectors.

---

## 5. Automated Verification & Quality Gates

Every code change must pass 5 continuous quality gates before merging:

```bash
# 1. Typecheck: Verify strict TypeScript compilation with zero errors
npm run typecheck

# 2. Lint: Enforce Next.js Core Web Vitals and TypeScript ESLint rules
npm run lint

# 3. Code Style: Confirm Prettier formatting across all files
npm run format:check

# 4. Unit & Integration Tests with Coverage Gate (> 95% line coverage)
npm test -- --coverage

# 5. Production Compilation
npm run build
```

---

## 6. Documentation Standards

- All exported domain utilities, backend endpoints, and reusable primitives must feature structured TSDoc annotations (`@summary`, `@param`, `@returns`, `@throws`).
- Architectural decisions altering system semantics are permanently recorded in `docs/adr/`.
