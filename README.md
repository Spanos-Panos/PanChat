# PanChat

Lightweight LAN messaging with optional inline tasks and simple profiles. A full-stack learning and portfolio project by Panos.

**Stack:** React (Vite) · Fastify · PostgreSQL · Prisma · Docker · pnpm monorepo

---

## Prerequisites

- [Node.js](https://nodejs.org/) 22+ (LTS)
- [pnpm](https://pnpm.io/) 11+ (`npm install -g pnpm`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)

---

## Project structure

```text
PanChat/
├── apps/
│   ├── web/          # React frontend (port 5173)
│   └── api/          # Fastify API (port 4000)
├── docker-compose.yml
├── .env.example      # copy to .env (not committed)
├── thread-task-chat-brief.md
└── panchat-learning-journal.md
```

---

## First-time setup

### 1. Environment variables

```powershell
cd PanChat
copy .env.example .env
```

Edit `.env` if needed. Default `DATABASE_URL` uses port **5433** (see note below).

Also ensure `apps/api/.env` has the same `DATABASE_URL` (used by Prisma CLI).

### 2. Install dependencies

```powershell
pnpm install
```

If pnpm reports ignored build scripts, ensure `pnpm-workspace.yaml` includes:

```yaml
allowBuilds:
  esbuild: true
  prisma: true
  '@prisma/client': true
  '@prisma/engines': true
```

### 3. Start PostgreSQL (Docker)

```powershell
docker compose up -d
docker compose ps
```

Container `panchat-db` should be **Up**, port **5433→5432**.

### 4. Apply database migrations

```powershell
cd apps\api
pnpm exec prisma migrate dev
cd ..\..
```

### 5. Run the apps

Use **two terminals** from the repo root:

```powershell
# Terminal 1 — API
pnpm dev:api

# Terminal 2 — Web
pnpm dev:web
```

---

## URLs (local dev)

| Service | URL |
|---------|-----|
| Web app | http://localhost:5173 |
| API health | http://localhost:4000/health |
| API + DB health | http://localhost:4000/health/db |

---

## Useful commands

| Command | Purpose |
|---------|---------|
| `pnpm dev:web` | Start React dev server |
| `pnpm dev:api` | Start Fastify API (tsx watch) |
| `docker compose up -d` | Start Postgres |
| `docker compose down` | Stop Postgres (data kept in volume) |
| `cd apps/api && pnpm exec prisma studio` | Browse database in browser |
| `cd apps/api && pnpm exec prisma migrate dev` | Apply schema changes (dev) |

---

## Windows: PostgreSQL port 5433

PanChat maps Docker Postgres to host port **5433** because many Windows machines already run PostgreSQL on **5432**.

If `prisma migrate` fails with **P1000 authentication failed** on port 5432, you are likely hitting the wrong server. Use **5433** in:

- `docker-compose.yml` → `"5433:5432"`
- `.env` and `apps/api/.env` → `...@localhost:5433/panchat`

---

## Phase 0 status

- [x] Monorepo, web, API, Docker, Prisma `users` table, health routes
- [ ] Phase 1: email auth, profiles, chat (see `thread-task-chat-brief.md`)

---

## Docs

- **Product spec:** `thread-task-chat-brief.md`
- **Learning log & quizzes:** `panchat-learning-journal.md`
