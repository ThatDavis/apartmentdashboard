# Apartment Dashboard

A PIN-protected mobile-friendly web app for sharing Home Assistant device data (soil sensors, switches) with neighbors in a shared space — no HA accounts required.

## Stack

- **Language:** TypeScript (Node.js)
- **Runtime/Framework:** Fastify (backend) + React (frontend)
- **Frontend:** React + Tailwind CSS
- **Database:** SQLite
- **ORM:** Drizzle ORM
- **Testing:** Vitest
- **Linting:** ESLint + Prettier
- **Package Manager:** pnpm
- **Hosting:** Docker Compose (self-hosted behind reverse proxy)
- **CI/CD:** GitHub Actions

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- Docker & Docker Compose (for production deployment)

### Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd apartment-dashboard

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Home Assistant URL and token

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

The development server will start the Vite dev server on port 5173 (frontend) and the Fastify API on port 3000 (backend).

### Running Tests

```bash
pnpm test
```

## Project Structure

```
apartment-dashboard/
├── src/
│   ├── client/          # React frontend
│   │   ├── components/  # React components
│   │   ├── App.tsx      # Main app component
│   │   ├── main.tsx     # Entry point
│   │   └── index.html   # HTML template
│   ├── server/          # Fastify backend
│   │   ├── routes/      # API routes
│   │   ├── db/          # Database schema & connection
│   │   └── index.ts     # Server entry point
│   └── shared/          # Shared types/utilities
├── tests/               # Test files
├── docs/                # Documentation
│   ├── SPEC.md          # Feature specifications
│   ├── ARCHITECTURE.md  # Architecture decisions
│   └── adr/             # Architecture Decision Records
├── .agent/              # Agent continuity files
├── .github/workflows/   # CI/CD workflows
├── docker-compose.yml   # Docker Compose config
├── Dockerfile           # Docker image
└── package.json
```

## Features

*No features implemented yet. See [PLAN.md](PLAN.md) for the roadmap.*

## Deployment

### Using Docker Compose

```bash
# Pull the latest image
docker compose pull

# Start the container
docker compose up -d
```

### Environment Variables

See `.env.example` for required environment variables.

## License

MIT
