# Architecture — Apartment Dashboard

> Last updated: Tue Jun 02 2026

## Stack Decisions

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Language | TypeScript | Type safety, excellent HA client libraries, modern web app standard |
| Framework | Fastify | Fast, modern, built-in validation, excellent for APIs |
| Database | SQLite | Zero-config, embedded, perfect for small-scale app with few users |
| ORM | Drizzle ORM | Lightweight, type-safe, purpose-built for SQLite |
| Frontend | React | Component-based, handles real-time updates elegantly |
| CSS | Tailwind CSS | Rapid development, mobile-first, utility-first |
| Testing | Vitest | Fast, native TypeScript support, standard for Vite projects |
| Hosting | Docker Compose | Self-hosted behind reverse proxy, easy deployment |
| CI/CD | GitHub Actions | Build and push Docker images to GHCR on every push |

## Project Structure

```
apartment-dashboard/
├── src/
│   ├── client/          # React frontend
│   │   ├── components/  # React components (Login, Dashboard, DeviceCard, ScheduleEditor, AdminDashboard)
│   │   ├── hooks/       # React hooks (useTheme, useDevices, useAuth)
│   │   ├── App.tsx      # Main app with auth state management
│   │   ├── main.tsx     # Entry point
│   │   ├── index.html   # HTML template with mobile meta tags
│   │   └── index.css    # Global styles with glass morphism & twilight theme
│   ├── server/          # Fastify backend
│   │   ├── routes/      # API routes (auth, devices, admin, schedules, twilight)
│   │   ├── services/    # Business logic (scheduleExecutor, homeAssistant)
│   │   ├── db/          # Drizzle schema and database connection
│   │   └── index.ts     # Server bootstrap
│   └── shared/          # Shared types and utilities
├── tests/               # Vitest tests
├── docs/                # Documentation
│   ├── SPEC.md          # Feature specifications
│   ├── ARCHITECTURE.md  # Architecture decisions
│   └── adr/             # Architecture Decision Records
├── .agent/              # Agent continuity files
├── .github/workflows/   # GitHub Actions CI/CD
├── docker-compose.yml   # Production deployment
├── Dockerfile           # Multi-stage build
└── PLAN.md              # Project roadmap
```

### Architectural Notes
- **Frontend builds into `dist/client/`** which is served statically by Fastify in production
- **API routes prefixed with `/api/`** for clean separation
- **SQLite database in `./data/`** directory, persisted via Docker volume
- **Vite dev proxy** routes `/api` to Fastify server during development

## Key Design Decisions

### Theme System
The app features a twilight-aware theme that transitions between light and dark modes based on civil twilight times for Chicago, IL. The theme system:
- Calculates dawn/dusk progression in JavaScript (see `useTheme.ts`)
- Sets interpolated CSS custom properties (`--bg-color`, `--text-color`, etc.) on `:root`
- Uses static semi-transparent glass effects that work across both light and dark backgrounds
- Supports manual override (Auto/Light/Dark) with a sun/moon toggle
- Avoids CSS `color-mix()` and `@property` for broader browser compatibility

### Glass Morphism UI
All UI elements use a glass morphism design with:
- Semi-transparent backgrounds (`rgba(255,255,255,0.08-0.2)`)
- Heavy backdrop blur (`blur(20px) saturate(180%)`)
- Inset box shadows for beveled edges
- Works over both light and dark wallpaper backgrounds

### Switch Scheduling
- Visual 24-hour slider with draggable handles
- Civil twilight zones shown as gradient backgrounds
- 15-minute snap intervals
- Background scheduler runs every 60 seconds with DST-aware Chicago timezone
- Stores schedules in SQLite with Drizzle ORM

## Architecture Decision Records

- `docs/adr/` — *No ADRs yet.*

## Open Design Questions

*None yet.*
