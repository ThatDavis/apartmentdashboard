# AI Instructions for Apartment Dashboard

These instructions apply to every AI coding session in this project.

## Project context

PIN-protected mobile web app for sharing Home Assistant devices with neighbors. Stack: TypeScript + Fastify + React + SQLite + Tailwind CSS. See `README.md` for overview, `docs/ARCHITECTURE.md` for stack decisions, and `docs/SPEC.md` for feature specs.

## Priorities

1. **Security first** — PIN auth, rate limiting, no secrets in code
2. **Mobile experience** — sub-second loads, touch-friendly, responsive
3. **Simplicity** — minimal dependencies, easy to maintain

## How to help

- Always write code that a non-technical person can understand and maintain
- Prefer simple and working over clever and fragile
- Make minimal edits — change only the lines that need changing
- Explain tradeoffs in plain English before making significant technical decisions
- When requirements are ambiguous, check `docs/SPEC.md` for user flows and edge cases
- Keep `PLAN.md` updated — mark items done, move to Completed section
- Before starting any feature, check `docs/SPEC.md` and `PLAN.md`

### Decision discipline

- **Never make changes without verifying with the user first.** If a requirement is unclear, ambiguous, or potentially destructive, stop and ask.
- **Never blindly agree with the user.** If a requested approach is risky, overly complex, or contradicts existing architecture, push back politely.
- **Always present options.** When a decision is needed, offer 2-3 concrete approaches with pros and cons.
- **Prefer the simplest fix.** If a bug can be fixed with a one-line change, do that instead of refactoring the entire module. Escalate to larger refactors only when the simple fix is demonstrably wrong.
- **Surgical edits only.** Change exactly what needs changing. Do not rewrite whole files or reformat unrelated code.

## Development workflow

All agents follow this git discipline. It should be invisible to the user — no commit announcements unless they ask.

### Commits

- After every 1-3 files changed, or after completing a logical sub-task, stage and commit automatically.
- Do **not** announce micro-commits.
- Use conventional commit format: `type(scope): description` (e.g. `fix(api): correct device state caching`).
- If a remote exists, push the branch after each commit.

### Branching

- **Large** (>3 files, new routes, DB changes, new pages, or multi-session work) → `git checkout -b feature/short-descriptive-name`
- **Small** (typos, copy changes, single-file tweaks) → work directly on the current branch
- When a feature branch is complete, open a Pull Request for human review. Never merge directly to `main` locally.

### Plan maintenance

- `PLAN.md` must be updated after every work session: mark completed items, update the `Last updated:` date.
- If a milestone is fully complete, move its items to `## Completed Features` with the completion date.
- New bugs or requirements discovered during work should be added to the appropriate milestone immediately.

## Reference docs

| File | Purpose |
|------|---------|
| `docs/ARCHITECTURE.md` | Stack decisions, project structure, key conventions |
| `docs/SPEC.md` | Feature specifications with user flows, edge cases, acceptance criteria |
| `PLAN.md` | Roadmap and milestones |
| `PROGRESS.md` | Day-to-day task tracking |
