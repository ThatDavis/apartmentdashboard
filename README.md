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

## Features

- **PIN Authentication** — Simple username + PIN login, no HA accounts needed
- **Device Dashboard** — Mobile-optimized view of shared devices
- **Real-time Updates** — Live device status via 5-second polling
- **Switch Control** — Toggle on/off switches directly from the dashboard
- **Switch Scheduling** — Visual 24-hour scheduler with civil twilight display
- **Admin Panel** — Manage devices, users, and PINs (admin-only)
- **Battery Monitoring** — Visual battery indicators with low-battery warnings
- **Offline Detection** — Clearly shows when devices are unavailable
- **Account Security** — Auto-lockout after 5 failed login attempts

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

# Create your first admin user
pnpm db:seed admin 1234 --admin

# Create a regular user
pnpm db:seed neighbor1 1234

# Start development server
pnpm dev
```

The development server will start the Vite dev server on port 5173 (frontend) and the Fastify API on port 3000 (backend).

### Home Assistant Configuration

1. In Home Assistant, go to your **User Profile** (bottom-left)
2. Scroll to **Long-Lived Access Tokens** and click **Create Token**
3. Name it "Apartment Dashboard" and copy the token immediately
4. Add to your `.env` file:
   ```
   HA_URL=http://your-ha-instance:8123
   HA_TOKEN=your_long_lived_token_here
   ```

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

## Deployment

### Using Docker Compose (Pre-built Image)

Create a `docker-compose.yml` file that pulls the image from GitHub Container Registry:

```yaml
services:
  app:
    image: ghcr.io/ThatDavis/apartmentdashboard:latest
    container_name: apartment-dashboard
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=./data/app.db
      - JWT_SECRET=${JWT_SECRET:?JWT_SECRET is required}
      - HA_URL=${HA_URL:?HA_URL is required}
      - HA_TOKEN=${HA_TOKEN:?HA_TOKEN is required}
    volumes:
      - ./data:/app/data
```

Run it:

```bash
# Create data directory
mkdir -p data

# Set required environment variables
export JWT_SECRET="your-secure-secret-key"
export HA_URL="http://your-ha-instance:8123"
export HA_TOKEN="your_long_lived_token_here"

# Pull and start
docker compose pull
docker compose up -d
```

### Using Docker Compose (Build Locally)

If you prefer to build from source:

```bash
# Pull the latest image
docker compose pull

# Start the container
docker compose up -d
```

### Create Users (Docker)

```bash
# Create an admin user (required for device management)
docker compose exec app node scripts/seed-user-prod.mjs admin 1234 --admin

# Create a regular user
docker compose exec app node scripts/seed-user-prod.mjs neighbor1 1234
```

**Note:** Admin users can access the Admin Panel (gear icon) to manage devices and other users. At least one admin is required to add shared devices.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HA_URL` | Home Assistant URL | `http://homeassistant.local:8123` |
| `HA_TOKEN` | Long-lived access token | *(required)* |
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | Secret for JWT tokens | *(required)* |
| `DATABASE_URL` | SQLite database path | `./data/app.db` |

## License

MIT
