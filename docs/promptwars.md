# PromptWars Virtual — Challenge 5 notes

Research gathered on 2026-10-20 for Festa's submission to **PromptWars Virtual, Challenge 5: Celebration & Event Planner**. Items marked *(official)* come from promptwars.in / hack2skill.com. Items marked *(observed)* come from other participants' public repos and are not confirmed by the organisers. Re-check the official challenge page before submitting; the site said it was "undergoing a brief refresh" when this was written.

## What PromptWars Virtual is

- Bi-weekly virtual hackathon run by Google for Developers with Hack2Skill. Eligibility: India. *(official)*
- 14-day cycle: challenge release → building → **submission by Day 13** → expert evaluation and leaderboard on **Day 14**. *(official)*
- Rewards are Prompt Credits by rank (rank 1 = 5,000 PC per challenge, ranks 301–400 = 500 PC). Credits expire 1 Jan 2027. Consistency bonuses: Top 50 three challenges in a row = 25,000 PC; top 5 Instagram reels = 4,000 PC; top 3 women developers = 1,500 PC. *(official)*
- Unfair means (plagiarism, cheating, multiple accounts) lead to disqualification. *(official)*

## Submission requirements ("Dual Submission")

*(official)*

1. **Technical:** the code (public repository) **and a live preview** of the app.
2. **Narrative:** a technical blog post **and** a LinkedIn "Build-in-Public" post explaining how the problem was solved, not just the result.

## Tooling rule — action needed

> **The FAQ says Google Antigravity is a requirement for all submissions.** *(official)*

Festa is being built with Claude Code. Confirm with the organisers (promptwarssupport@hack2skill.com) whether this is acceptable, or do part of the build and the final verification pass inside Google Antigravity and mention that in the narrative.

## Repository rules seen across submissions

*(observed — consistent across several Challenge 3–5 repos)*

| Rule | Festa status |
| --- | --- |
| Public GitHub repository | to do at publish time |
| Single branch only (`main`) | keep the repo on `main` |
| Repository size under 10 MB (some cite 1 MB) | no binaries or images committed; images load from remote URLs |
| Comprehensive README covering the chosen vertical, approach, logic and assumptions | `README.md` |

## How submissions are scored

The Challenge 4 leaderboard shows scores out of 100, with the top 100 clustered between ~95 and ~98. That spread, and participants' reports, indicate an automated AI evaluator reads the repository and live app. *(observed)*

Criteria repeatedly reported by participants *(observed)*:

| Criterion | What evaluators appear to look for | How Festa addresses it |
| --- | --- | --- |
| Code Quality | Modular structure, strict typing, no dead code, clear naming | Strict TypeScript, feature folders, shared Zod schemas, ESLint |
| Security | No secrets in code, input validation, auth/ownership checks, rate limits, security headers | Groq key only in Convex env; every Convex function checks ownership; Zod + Convex validators; per-user AI rate limit; CSP and security headers in `next.config.ts` |
| Efficiency | Small bundles, few AI calls, caching, fast responses | One AI call per blueprint; real-time Convex queries with indexes; deterministic maths in code |
| Testing | Unit tests on core logic, ideally integration tests | Vitest for budget maths, deadline generation, AI-response parsing, fallback planner; `convex-test` for authorization |
| Accessibility | Semantic HTML, keyboard navigation, focus states, contrast, reduced motion | Radix primitives, visible focus rings, `prefers-reduced-motion`, labelled form fields |
| Problem Statement Alignment | Solves the stated celebration/event-planning problem end to end | Wizard → AI blueprint → budget, timeline, vendors, moodboard, concierge |
| Google Services Usage | Meaningful use of Google products | Google Fonts (Instrument Serif, Geist), Google Calendar "add event" links, keyless Google Maps venue embed. Gemini is deliberately **not** used (cost rule in the brief) |

## Narrative checklist (Day 13)

- Blog post: problem, architecture (Next.js + Convex + Groq), how AI output is validated and why maths stays deterministic, the concierge's propose-then-approve flow, the non-AI fallback, screenshots, live link, repo link.
- LinkedIn post: short build-in-public story, a screenshot or short clip, the live link, `#PromptWars` and the Google for Developers / Hack2Skill tags.

## Sources

- https://promptwars.in/promptwarsVirtual.html (official page and FAQ)
- https://hack2skill.com/event/pwvirtual1 (event page and Challenge 4 leaderboard)
- https://internshala.com/competitions/promptwars-virtual/
- Participant repos that document the rubric: github.com/HARSH0177/carbonlensai, github.com/harishkumarv-dev/Bharat-Vote-Assistant, github.com/eshwarhs170-a11y/Prompt-Wars, github.com/Hrithik450/promptwars
