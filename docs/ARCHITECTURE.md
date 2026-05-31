# Architecture — Apartment Dashboard

> Last updated: Sun May 31 2026

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
│   │   ├── components/  # React components (Login, Dashboard, DeviceCard)
│   │   ├── App.tsx      # Main app with auth state management
│   │   ├── main.tsx     # Entry point
│   │   └── index.html   # HTML template with mobile meta tags
│   ├── server/          # Fastify backend
│   │   ├── routes/      # API routes (auth, health, devices)
│   │   ├── db/          # Drizzle schema and database connection
│   │   └── index.ts     # Server bootstrap
│   └── shared/          # Shared types and utilities
├── tests/               # Vitest tests
├── docs/                # Documentation
├── .github/workflows/   # GitHub Actions CI/CD
├── docker-compose.yml   # Production deployment
└── Dockerfile           # Multi-stage build
```

### Architectural Notes
- **Frontend builds into `dist/client/`** which is served statically by Fastify in production
- **API routes prefixed with `/api/`** for clean separation
- **SQLite database in `./data/`** directory, persisted via Docker volume
- **Vite dev proxy** routes `/api` to Fastify server during development

## Key Design Decisions

*No architecture decisions recorded yet. Run `/dev:file-adr` when making significant design choices.*

## Architecture Decision Records

- `docs/adr/` — *No ADRs yet.*

## Open Design Questions

*None yet.*
