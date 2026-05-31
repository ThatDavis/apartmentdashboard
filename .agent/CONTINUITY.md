# CONTINUITY — Apartment Dashboard

> Canonical project briefing. Read at session start.
> Stack: TypeScript + Fastify + React + SQLite
> Type: Web app

## [PLANS]

### Milestone 1: Basic Dashboard (In Progress)
Goal: Connect to Home Assistant, display sensor data and switch controls with PIN protection
- [x] Home Assistant API integration (Issue #1, branch feature/1-home-assistant-integration) — Completed
- [x] PIN + username authentication (Issue #2, branch feature/2-pin-authentication) — Completed
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
| Sun May 31 2026 | Completed feature: Home Assistant API integration. All acceptance criteria met. |
| Sun May 31 2026 | Started feature: PIN + username authentication (Issue #2) on branch feature/2-pin-authentication. |
| Sun May 31 2026 | Completed feature: PIN + username authentication. All acceptance criteria met. |
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

## [DISCOVERIES]

*None yet.*

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
