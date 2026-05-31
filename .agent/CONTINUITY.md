# CONTINUITY — Apartment Dashboard

> Canonical project briefing. Read at session start.
> Stack: TypeScript + Fastify + React + SQLite
> Type: Web app

## [PLANS]

### Milestone 1: Basic Dashboard (Complete)
Goal: Connect to Home Assistant, display sensor data and switch controls with PIN protection
- [x] Home Assistant API integration (Issue #1, branch feature/1-home-assistant-integration) — Completed
- [x] PIN + username authentication (Issue #2, branch feature/2-pin-authentication) — Completed
- [x] Mobile-optimized dashboard (Issue #3, branch feature/3-mobile-dashboard) — Completed
- [x] Real-time device status display — Completed
- [x] Switch toggles for shared devices — Completed
- [x] Soil sensor data visualization — Completed
- [x] Battery indicator for battery-powered devices — Completed
- [x] Offline device detection — Completed
- [x] Account lockout after failed PIN attempts — Completed
- [x] Health endpoint for HA connectivity — Completed

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
| Sun May 31 2026 | Completed feature: Home Assistant API integration. All acceptance criteria met. |
| Sun May 31 2026 | Started feature: PIN + username authentication (Issue #2) on branch feature/2-pin-authentication. |
| Sun May 31 2026 | Completed feature: PIN + username authentication. All acceptance criteria met. |
| Sun May 31 2026 | Completed feature: Mobile dashboard with real-time device data. All acceptance criteria met. |
|  |    ✓ Create auth middleware to protect API routes |
|  |    ✓ Add user seeding mechanism |
|  |    ✓ Apply authentication to device routes |
|  |    ✓ Write tests for auth functionality |
|  |    ✓ Create HA API client/service module |
|  |    ✓ Implement device state fetching from HA |
|  |    ✓ Implement switch toggle command to HA |
|  |    ✓ Update health endpoint with HA connectivity check |
|  |    ✓ Add error handling and retry logic |
|  |    ✓ Write tests for HA integration |
|  |    ✓ Connect Dashboard to real API with polling |
|  |    ✓ Add switch toggle UI with API integration |
|  |    ✓ Add battery indicator with color coding |
|  |    ✓ Add offline device detection |

## [DISCOVERIES]

- Docker builds require `ENV CI=true` to prevent pnpm from prompting for TTY confirmation
- pnpm ignores build scripts by default; need `.npmrc` with `ignore-build-scripts=false` or manual rebuilds
- Fastify's `routerPath` isn't available in TypeScript types; use `request.raw.url` instead

## [OUTCOMES]

### Home Assistant API Integration (Sun May 31 2026)
- Created HomeAssistantService with REST API client for HA communication
- Implemented device state fetching, toggle commands, and health checks
- Added comprehensive error handling with graceful fallbacks
- All tests passing (13/13)

### PIN + Username Authentication (Sun May 31 2026)
- Created auth middleware to protect API routes (except public ones)
- Added user seed script for creating initial users
- Applied authentication to all device routes
- Wrote 9 auth tests covering login, lockout, and token validation

### Mobile Dashboard (Sun May 31 2026)
- Connected Dashboard to /api/devices with JWT authentication
- Implemented 5-second polling for real-time updates
- Added switch toggle UI with API integration
- Added battery indicator with color-coded levels
- Implemented offline device detection
- All tests passing (22/22)

### Milestone 1 Complete
All 10 features implemented and merged. Project is functional end-to-end.
