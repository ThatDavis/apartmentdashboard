# CONTINUITY — Apartment Dashboard

> Canonical project briefing. Read at session start.
> Stack: TypeScript + Fastify + React + SQLite
> Type: Web app

## [PLANS]

### Milestone 1: Basic Dashboard (In Progress)
Goal: Connect to Home Assistant, display sensor data and switch controls with PIN protection
- [ ] Home Assistant API integration (Issue #1, branch feature/1-home-assistant-integration) — In Progress
- [ ] PIN + username authentication
- [ ] Mobile-optimized dashboard
- [ ] Real-time device status display
- [ ] Switch toggles for shared devices
- [ ] Soil sensor data visualization
- [ ] Battery indicator for battery-powered devices
- [ ] Offline device detection
- [ ] Account lockout after failed PIN attempts
- [ ] Health endpoint for HA connectivity

### Future Milestones
- Milestone 2: Data history and trends
- Milestone 3: Enhanced sharing and access controls

### Open Questions
- [ ] Support multiple HA instances?
- [ ] Expected concurrent user count?

## [DECISIONS]

- Sun May 31 2026: Initial stack — TypeScript + Fastify + React + SQLite. Rationale: Fastify is fast and modern for APIs, React handles real-time UI well, SQLite requires zero setup for small deployments.
- Sun May 31 2026: Deep-plan validated Milestone 1. Key decisions: HA connectivity via health endpoint, rate limiting for PIN brute force, mobile-first responsive design.

## [PROGRESS]

| Date | What was done |
|------|---------------|
| Sun May 31 2026 | Initial scaffold. Stack: TypeScript + Fastify + React + SQLite + Tailwind. Docker + GitHub Actions CI/CD configured. |
| Sun May 31 2026 | Started feature: Home Assistant API integration (Issue #1) on branch feature/1-home-assistant-integration. |
|  |    — Create HA API client/service module |
|  |    — Implement device state fetching from HA |
|  |    — Implement switch toggle command to HA |
|  |    — Update health endpoint with HA connectivity check |
|  |    — Add error handling and retry logic |
|  |    — Write tests for HA integration |

## [DISCOVERIES]

*None yet.*

## [OUTCOMES]

*None yet.*
