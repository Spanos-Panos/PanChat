# PanChat

Lightweight LAN messaging with **recipient-only inline tasks** and simple profiles. A full-stack learning and portfolio project by Panos.

**Stack:** React 19 (Vite) · Fastify · PostgreSQL · Prisma · Docker · pnpm monorepo

**Current features:** email register/login · profile onboarding · avatar upload · global user list · 1-1 chat · **live messages (Socket.io)** · attach task on send · My tasks inbox · clear/delete task (recipient-only) · live avatar updates across tabs

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

## Demo checklist (portfolio video ~2–3 min)

Use **two browser windows** (normal + incognito) with API + web running.

1. Register or log in as **User A**; complete profile (username).
2. Log in as **User B** in incognito.
3. **User A** opens chat with **User B** → send a message → **B sees it instantly** (no refresh).
4. **User A** sends a message **with a task** attached.
5. **User B** sees the task panel → **Clear** or **Delete**; check **My tasks** in the sidebar.
6. **User B** uploads an **avatar** → **User A** sees it update in People list without refresh.
7. Optional: show register flow, logout, log back in (session cookie).

Record with OBS or Windows Game Bar; mention stack in voiceover or title slide.

---

## Project status (2026-05-30)

| Area | Status |
|------|--------|
| Monorepo, Docker Postgres, health routes | Done |
| Auth + register + profile onboarding | Done |
| 1-1 chat + Socket.io live messages | Done |
| Recipient-only tasks + My tasks UI | Done |
| Avatar upload + live `user:updated` | Done |
| Demo video + public README polish | **Next (Wave E)** |
| LAN phone test | Optional before portfolio |
| Electron `.exe` | Later (v1.1) |

Details: `thread-task-chat-brief.md` §21.2d · learning log: `panchat-learning-journal.md`

---

## Docs

- **Product spec:** `thread-task-chat-brief.md`
- **Learning log & quizzes:** `panchat-learning-journal.md`
