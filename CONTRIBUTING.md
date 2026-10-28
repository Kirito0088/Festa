# Contributing to Festa

Thank you for contributing to Festa! This guide provides instructions for setting up the development environment, adhering to code quality standards, and submitting contributions.

---

## Getting Started

### Prerequisites

- **Node.js:** 22.x (see `package.json` engines)
- **npm:** 10.x or higher
- **Convex Account:** For local backend development (`npx convex dev`)

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/Kirito0088/Festa.git
cd Festa

# 2. Install dependencies
npm install

# 3. Start local Convex backend
npx convex dev

# 4. In a separate terminal, launch the Next.js dev server
npm run dev
```

---

## Development Standards

### 1. Code Style & Formatting

- All code must conform to Prettier rules defined in `.prettierrc.json`.
- Run `npm run format` to automatically format files.
- Run `npm run format:check` to verify compliance.

### 2. Linting & Static Analysis

- ESLint is configured with `eslint-config-next/core-web-vitals` and TypeScript rules.
- Run `npm run lint` before committing. Zero errors and zero warnings are required.

### 3. Type Safety

- Festa enforces strict TypeScript without `any` types.
- Run `npm run typecheck` to execute `next typegen && tsc --noEmit`.

### 4. Testing & Code Coverage

- All business logic in `lib/` must have accompanying unit tests in `tests/`.
- All backend mutations and queries in `convex/` must have integration tests in `convex/festa.test.ts`.
- Run tests: `npm test`
- Run coverage audit: `npm test -- --coverage` (Target: > 95% line coverage).

### 5. Verification Gate

Before opening a pull request or pushing, run the comprehensive verification script:

```bash
npm run check
```

---

## Commit Guidelines

- Write clear, concise commit messages in the imperative mood (e.g., `Add tests for task operations and update event details`).
- Keep commits atomic and self-contained.
- Ensure all CI checks pass.
