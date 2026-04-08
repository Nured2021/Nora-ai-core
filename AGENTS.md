# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

NORA AI Core is a monorepo with 5 services orchestrated via `docker-compose.yml`:

| Service | Tech | Port | Container |
|---------|------|------|-----------|
| PostgreSQL 16 | Database | 5432 | `nora_postgres` |
| Redis 7 | Broker/Cache | 6379 | `nora_redis` |
| FastAPI API | Python 3.12 | 8000 | `nora_api` |
| Celery Worker | Python 3.12 | — | `nora_worker` |
| Next.js Dashboard | Node 20 | 3000 | `nora_dashboard` |

### Starting All Services

```bash
cd /workspace && docker compose up --build -d
```

Wait for postgres and redis healthchecks before API/worker start (handled by `depends_on` in compose). The API auto-creates DB tables and seeds default users on startup.

### Default Credentials

| Username | Password | Role |
|----------|----------|------|
| `admin` | `nora-admin-2024` | ADMIN |
| `developer` | `nora-dev-2024` | DEVELOPER |
| `viewer` | `nora-view-2024` | VIEWER |

### Docker in Cloud VM

Docker must be installed and configured for nested containers (fuse-overlayfs storage driver, iptables-legacy). The dockerd must be started with `sudo dockerd &` before running `docker compose`. After starting dockerd, run `sudo chmod 666 /var/run/docker.sock` so docker commands work without sudo.

### Lint / Build / Test

- **Frontend lint**: `cd apps/dashboard && npx next lint`
- **Frontend build**: `cd apps/dashboard && npx next build`
- **Backend import check**: `cd services/api && python3 -c "from app.main import app"`
- No automated test suites exist in the repo currently.

### Key Gotchas

- The `passlib` bcrypt warning (`module 'bcrypt' has no attribute '__about__'`) at API startup is non-fatal and can be ignored. It's a known compatibility issue between passlib and newer bcrypt versions.
- `OPENAI_API_KEY` is optional; the system falls back to simulation/mock mode when not set.
- The `.eslintrc.json` file is required for `next lint` to run non-interactively. It was added with `next/core-web-vitals` extends.
- Frontend dev dependencies must be installed locally (`cd apps/dashboard && npm install`) for lint/build outside Docker.
- Backend Python dependencies: `pip install -r services/api/requirements.txt`
