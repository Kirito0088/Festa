# PromptWars Virtual — Challenge 5 notes

Research gathered on 2026-10-20 for Festa's submission to **PromptWars Virtual, Challenge 5: Celebration & Event Planner**. Items marked _(official)_ come from promptwars.in / hack2skill.com. Items marked _(observed)_ come from other participants' public repos and are not confirmed by the organisers. Re-check the official challenge page before submitting; the site said it was "undergoing a brief refresh" when this was written.

## What PromptWars Virtual is

- Bi-weekly virtual hackathon run by Google for Developers with Hack2Skill. Eligibility: India. _(official)_
- 14-day cycle: challenge release → building → **submission by Day 13** → expert evaluation and leaderboard on **Day 14**. _(official)_
- Rewards are Prompt Credits by rank (rank 1 = 5,000 PC per challenge, ranks 301–400 = 500 PC). Credits expire 1 Jan 2027. Consistency bonuses: Top 50 three challenges in a row = 25,000 PC; top 5 Instagram reels = 4,000 PC; top 3 women developers = 1,500 PC. _(official)_
- Unfair means (plagiarism, cheating, multiple accounts) lead to disqualification. _(official)_

## Submission requirements

The official page asks for a "Dual Submission" _(official)_: the code and a live preview, plus a narrative (a technical blog post and a LinkedIn "Build-in-Public" post).

The Challenge 5 form, as summarised by a [participant's write-up](https://saurabh-12.blogspot.com/2026/10/promptwars-challenge-5-celebration.html) on 2026-10-22 _(observed; confirm on the form itself)_, asks for:

1. A **public GitHub repository**, strictly under 10 MB.
2. A **deployed link** with working core features. Festa's is https://festa-ten-blush.vercel.app.
3. A **demo video**: an unlisted YouTube video, or Google Drive with sharing on.
4. **"Deployed version updates"**: implemented features, at most 1,024 characters.
5. **"GenAI services used"**: the models and where they are integrated, at most 1,024 characters.
6. A **LinkedIn post** URL.

There are **at most 3 submissions**, and the deadline is **1 November 2026, 11:59 PM IST**.

## Tooling rule — action needed

> **The FAQ says Google Antigravity is a requirement for all submissions.** _(official)_

Festa is being built with Claude Code. Confirm with the organisers (promptwarssupport@hack2skill.com) whether this is acceptable, or do part of the build and the final verification pass inside Google Antigravity and mention that in the narrative.

## Repository rules seen across submissions

_(observed — consistent across several Challenge 3–5 repos)_

| Rule                                                                               | Festa status                                                  |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Public GitHub repository                                                           | to do at publish time                                         |
| Single branch only (`main`)                                                        | keep the repo on `main`                                       |
| Repository size under 10 MB (some cite 1 MB)                                       | no binaries or images committed; images load from remote URLs |
| Comprehensive README covering the chosen vertical, approach, logic and assumptions | `README.md`                                                   |

## How submissions are scored

The official pages don't publish weights; the FAQ says selection criteria are confidential _(official)_. The Challenge 5 brief says the code is evaluated by AI on **six parameters** _(observed, per the write-up above)_, and a team also tests the live app by hand. "Google Services Usage", which earlier notes listed, is **not** one of the six.

| Parameter                   | What the brief asks                                                                                                          | How Festa addresses it                                                                                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code Quality                | Organised, readable, maintainable, consistent; separate responsibilities                                                     | Strict TypeScript; pure tested logic in `lib/`; one Convex module per feature; ESLint and Prettier enforced in CI; ADRs in `docs/adr/`                                                                        |
| Security                    | Protect keys, validate input, handle sensitive data carefully                                                                | Secrets only in Convex env; ownership checks on every function; server-side validation; schema-validated AI output; per-user and shared rate limits; CSP and security headers ([SECURITY.md](../SECURITY.md)) |
| Efficiency                  | No unnecessary work, sensible AI requests, responsive app, loading and failure states                                        | One AI call per blueprint; token-aware Groq budgets with a cooldown after a 429; deterministic maths in code; static landing; pre-subscribed tab data; functions in Mumbai                                    |
| Testing                     | Main workflows and edge cases: budgets, task updates, form validation, AI responses                                          | Vitest unit tests and convex-test integration tests (authorization, plan pipeline, concierge approval, rate limits, schedule); CI with coverage                                                               |
| Accessibility               | Labels, contrast, keyboard navigation, clear errors, responsive layouts                                                      | axe-core: 0 violations on every screen; labelled fields with associated errors; keyboard drag-and-drop; reduced-motion support; 375 px without horizontal scroll                                              |
| Problem Statement Alignment | Budget, timeline (deadlines, reminders, countdown, day-of schedule), vendor checklist, personalised ideas; AI must help plan | See the mapping table in the [README](../README.md#how-festa-answers-the-brief)                                                                                                                               |

Google products Festa uses without paid APIs: Google Fonts (Instrument Serif, Geist), Google Calendar event links and reminders, and Google Maps search links. There is no Maps embed.

## Narrative checklist (Day 13)

- Blog post: problem, architecture (Next.js + Convex + Groq), how AI output is validated and why maths stays deterministic, the concierge's propose-then-approve flow, the non-AI fallback, screenshots, live link, repo link.
- LinkedIn post: short build-in-public story, a screenshot or short clip, the live link, `#PromptWars` and the Google for Developers / Hack2Skill tags.

## Sources

- https://promptwars.in/promptwarsVirtual.html (official page and FAQ)
- https://hack2skill.com/event/pwvirtual1 (event page and Challenge 4 leaderboard)
- https://internshala.com/competitions/promptwars-virtual/
- Participant repos that document the rubric: github.com/HARSH0177/carbonlensai, github.com/harishkumarv-dev/Bharat-Vote-Assistant, github.com/eshwarhs170-a11y/Prompt-Wars, github.com/Hrithik450/promptwars
