# PanChat — Learning Journal (Panos)

> **Companion to:** [`thread-task-chat-brief.md`](./thread-task-chat-brief.md) (product spec, stack, MVP scope)  
> **Purpose:** Track **how Panos learns**, what he knows / is learning / is weak on, session notes, and **quizzes** — so any AI agent or future you can continue teaching without starting from zero.  
> **Last updated:** 2026-05-24  
> **Phase:** **3 web chat MVP done** (login → chat → logout). **Roadmap:** §11 (git → styling → features → ship).

---

## How to use this file (for AI agents)

1. Read **`thread-task-chat-brief.md` §0** first (author writes all code; agent teaches).
2. Read **this file** second — for Panos’s level, habits, and progress.
3. Teach **one step at a time**; after author says “done”, **verify files/terminal** and update **§4** + **§5** here.
4. **Quizzes (§6 rhythm):** every **5 completed steps** — but **never in the same message as new build steps**. Either **quiz → then next step**, or **one more step → then quiz**. Panos says when ready for the quiz.
5. **Git / GitHub:** Panos wants to **learn by running commands himself**. Agent gives **`git status` → `git add` → `git commit` → `git push`** as instructions; agent runs git **only** if Panos explicitly asks (2026-05-24).
6. You **may edit this file** and the product brief. You **must not** edit app code unless author waives §0 in that message.

---

## 1. About Panos (working profile)

| Item | Notes |
|------|--------|
| Age / context | 21, Greece, IEK (Computer Applications / multimedia), internship ending 2026 |
| Goal | Learn full-stack **properly** (not vibe coding); ship **PanChat** for portfolio |
| Strongest skills | **React**, **TypeScript**, **Electron** (ReactBitsAntigravity — published project) |
| Also built | Android/Kotlin (PianoTilesBot), partial Next.js + Supabase (NoteForge — backend not finished) |
| Learning style | Wants **slow steps**, **why before how**, agent checks work after each step, thinks like an engineer (asks good questions, e.g. `.env` vs `.env.example`) |
| Tools installed | Docker Desktop, Postman (light prior use), Cursor, pnpm 11.x, Node 22 |
| Language | Greek UI for app later; English for code, docs, and this journal |
| Career target | Junior Full Stack **after** PanChat ships end-to-end |

---

## 2. How we work together (rules)

| Rule | Detail |
|------|--------|
| Panos types | All code, configs, terminal commands |
| Agent | Explains → one step → review → update journals |
| **Git** | **Panos runs** commit/push; agent **teaches commands**, does not run git unless asked |
| Speed | Slow is correct; understanding > finishing fast |
| Mistakes | Expected; fix + note weakness in **§3** |
| Product truth | `thread-task-chat-brief.md` |
| Personal truth | **this file** |

### Agent teaching lessons (so we don’t repeat mistakes)

| Date | What went wrong | Fix for next time |
|------|-----------------|-------------------|
| 2026-05-24 | Agent ran `git commit` + `git push` when Panos wanted to **practice git himself** | Give command list; Panos runs; agent reviews output |
| 2026-05-24 | Prisma step listed `Thread`/`Message` but **User back-relations** were easy to miss | Always say: **“update BOTH models”** + show full `User { … }` block |
| 2026-05-24 | Panos refactored `requireUser` and **deleted** `PATCH /profile` body by accident | After refactors: **re-run same Postman checklist** before new features |
| Ongoing | Typos break logic: `userHighid`, `if(user)` vs `if(!user)`, `' desc'` | Read server log `statusCode`; compare field names to schema **exactly** |

---

## 3. Skills map (living document)

**Legend:** ✅ confident · 🟡 learning · 🔴 weak / not yet · ⬜ not started

| Topic | Level | Evidence / notes |
|-------|-------|------------------|
| Git / GitHub | 🟡 | `af796ae` Phase 0 · `132d466` API · `f6a335b` Phase 3 web — Panos runs commit/push himself |
| pnpm / monorepo | 🟡 | Quiz 1: knows `dev:web` + `@panchat/web`; deepen workspace YAML meaning |
| `.env` / secrets | 🟡 | Asked strong questions; fixed `Thumbs.db` typo after review |
| React + Vite | 🟡 | Vite 8 + React 19 in `apps/web`; dev server verified |
| CSS Modules | 🟡 | Clean shell; `App.module.css` + global `index.css` variables |
| Docker / Compose | 🟡 | `panchat-db` Up on 5432; fixed `unless-stopped` typo from error message |
| PostgreSQL | 🟡 | Docker DB `panchat` on port **5433** (Windows Postgres on 5432) |
| Prisma | 🟡 | `User`, `Thread`, `Message`; relations two-sided; migrations + `prisma generate` when IDE types stale |
| Fastify / Node HTTP | 🟡 | Full auth + chat API on :4000; status codes 200/201/400/401/403/404/409 |
| JWT / cookies | 🟡 | Register/login set httpOnly cookie; `/me` verifies `sub`; Quiz 4 sharpen status codes |
| Socket.io | ⬜ | After REST chat + UI |
| Postman | 🟡 | Daily use Phase 1–2: POST vs GET, cookies, multi-user (panos + mitsos) |
| LAN / host vs client | 🟡 | Understands host + same laptop as client 1 (Q12) |
| TypeScript (backend) | 🟡 | `index.ts` ~446 lines; `lib/auth.ts`; typos are main pain (casing) |

### Weak spots to watch (update as we go)

- Backend ownership end-to-end (biggest gap vs portfolio goal)
- Docker commands and “what is a container” — teach when 0.6 lands
- Prisma migrations vs `schema.prisma` — teach at 0.10–0.11
- Rushing ahead without verifying in terminal — remind to paste output
- **Refactors / extract helper** — easy to delete business logic while moving auth (e.g. `requireUser` ok but `PATCH /profile` body lost). Use **small steps + re-test same Postman flow** after each move.
- **HTTP status codes** — Quiz 4: mix up 201/200/409/401/404; keep cheat sheet in notebook.
- **Prisma `orderBy`** — must be exact `'asc'` / `'desc'` (no spaces).
- **Docker not running** — `P1001` → `docker compose up -d` before migrate.

### Strengths to leverage

- Already shipped a complex **Electron + React** app
- Cares about **security hygiene** (asks about `.env`)
- Accepts corrections without friction (e.g. `Thumbs.debug` → `Thumbs.db`)

---

## 4. Phase 0 progress (mirror of brief §21.2)

| Step | Done | Date | One-line note |
|------|------|------|----------------|
| 0.0 `.gitignore` | [x] | 2026-05-21 | Understood `.env` vs example after quiz |
| 0.1 pnpm | [x] | 2026-05-21 | pnpm 11.1.3, node 22.22.0 |
| 0.2 folders | [x] | 2026-05-21 | `apps/web`, `apps/api` |
| 0.3 monorepo root | [x] | 2026-05-21 | `package.json` + `pnpm-workspace.yaml`; expected “no projects” |
| 0.4 Vite web | [x] | 2026-05-21 | `@panchat/web`, React 19, Vite 8, `pnpm install` + dev OK |
| 0.5 CSS Module | [x] | 2026-05-21 | Stripped Vite demo; module + `index.css` globals; typos fixed |
| 0.6 Docker Postgres | [x] | 2026-05-21 | Typo `unless-unstopped` → `unless-stopped`; container Up |
| 0.7 `.env` | [x] | 2026-05-21 | `.env` + `.env.example`; WEB_ORIGIN colon fixed; git init deferred to 0.13 |
| 0.8 API package | [x] | 2026-05-21 | Fastify + tsx; pnpm 11 `allowBuilds.esbuild: true` |
| 0.9 `GET /health` | [x] | 2026-05-21 | Browser `localhost:4000/health` → `{"ok":true}` |
| 0.10 Prisma User | [x] | 2026-05-21 | schema + `apps/api/.env` → Docker Postgres URL |
| 0.11 migrate + `/health/db` | [x] | 2026-05-22 | migrate `init_users`; port 5433; `/health/db` OK; fix `NODE.ENV` typo |
| 0.12 README | [x] | 2026-05-22 | Agent-written `README.md` (author requested) |
| 0.13 git + GitHub | [x] | 2026-05-22 | `af796ae` on `main`; pushed to `Spanos-Panos/PanChat` (private) |

### Phase 1 — Auth API

| Step | Done | Date | One-line note |
|------|------|------|----------------|
| 1.1 Auth packages | [x] | 2026-05-24 | bcrypt, `@fastify/cookie`, `@fastify/jwt`; `allowBuilds` |
| 1.2 JWT + cookie plugins | [x] | 2026-05-24 | After CORS; `JWT_SECRET` guard |
| 1.3 `POST /auth/register` | [x] | 2026-05-24 | 201 + cookie; learned POST not GET in browser |
| 1.4 `POST /auth/login` | [x] | 2026-05-24 | Fixed `if(!user)` + save file |
| 1.5 Postman auth checklist | [x] | 2026-05-24 | 409 duplicate, 401 bad password |
| 1.6 `GET /auth/me` | [x] | 2026-05-24 | Cookie → JWT → user |
| 1.7 `POST /auth/logout` | [x] | 2026-05-24 | clearCookie → `/me` 401 |
| 1b profile `PATCH /me/profile` | [x] | 2026-05-24 | username required; `profileCompletedAt` |
| 1b `lib/auth.ts` `requireUser` | [x] | 2026-05-24 | Refactor regression once; fixed |
| 1b `GET /users` | [x] | 2026-05-24 | Public fields only; 2 test users |

### Phase 2 — 1-1 chat API

| Step | Done | Date | One-line note |
|------|------|------|----------------|
| 2.1 Prisma Thread + Message | [x] | 2026-05-24 | Both-sided relations; migration applied |
| 2.2 `POST /threads` | [x] | 2026-05-24 | `orderUserPair` + `upsert` |
| 2.3 `POST /threads/:id/messages` | [x] | 2026-05-24 | Fixed `userHighId` typo |
| 2.4 `GET /threads/:id/messages` | [x] | 2026-05-24 | Both users see history |
| 2.5 `GET /threads` | [x] | 2026-05-24 | Inbox + `lastMessage`; fixed `' desc'` |
| 2.6 Git commit + push | [x] | 2026-05-24 | `132d466` — **agent ran; Panos wants to run git next time** |

---

## 5. Session log (newest first)

### 2026-05-24 — Phase 1–2 API (auth + chat)

- Built full **auth loop** (register, login, me, logout) + **profile** + **user list**.
- **`requireUser`** helper in `apps/api/src/lib/auth.ts` — refactor deleted profile logic once; restored.
- **Quiz 4** (strict 4/7): bcrypt vs encrypt, status codes, `sub`, logout → 401 not 404.
- **Phase 2 chat:** Thread/Message schema, open thread panos↔mitsos, send/read messages, inbox list.
- **Bugs fixed by Panos:** `userHighId`, `if(!user)`, Prisma `' desc'`, Docker P1001, relation back-fields on `User`.
- **Git:** commit `132d466` pushed to GitHub — Panos asked to **run git himself** next milestone.
- **Mindset:** “with practice you learn more than just reading” — agrees with quiz + Postman loop.
- **Phase 3.1 done (2026-05-24):** `apps/web` `apiFetch` + `VITE_API_URL`; browser → `/health` = API OK.
- **Phase 3.2 done:** Login form in React; cookie + “Logged in as …” works.
- **UI policy (2026-05-24):** Functionality first — polish, layout, responsive (phone + desktop) **later** dedicated pass.
- **Phase 3.3 done:** `useEffect` + `GET /me` — session survives refresh; fixed `useEffect` async pattern.
- **Phase 3.4 done:** User list + `POST /threads` → `activeThread` with peer.
- **Phase 3.5 done:** Chat UI — load messages + send; fixed missing `/` in POST URL.
- **Milestone:** End-to-end 1-1 chat in browser (login → users → thread → messages).
- **E2E test (2026-05-24):** Normal window (panos) + incognito (mitsos) — both see history; sender labels You vs peer correct; real reply delivered.
- **Phase 3.6 done:** Logout button — `POST /auth/logout`, clear state, refresh stays logged out.
- **Phase 3 web MVP done:** login, session, users, thread, messages, logout (styling later).
- **Wave A git done:** `f6a335b` Phase 3 web pushed to `main` (Panos ran commands).
- **Roadmap:** Wave B styling next — see **§11**.

### 2026-05-21 — Phase 0 start

- Created `.gitignore`; learned `.env` / `.env.local` patterns.
- Installed pnpm; created monorepo skeleton.
- Author requested this **learning journal** + quizzes every 5 steps.
- **0.4 done:** Vite + React TS in `apps/web`, `@panchat/web`, lockfile at root.
- **0.5 done:** minimal PanChat shell + CSS Modules.
- **0.6 done:** Postgres in Docker; read error → fixed restart policy typo.
- **0.9 done:** `/health` → `{"ok":true}`.
- **Q16:** Quiz and build progress in **separate** messages; Quiz 2 pending.
- **0.13 done:** GitHub `Spanos-Panos/PanChat`, branch `main`.
- **Phase 0 complete.** Phase **1.1** auth packages installed (bcrypt, cookie, jwt).
- **Phase 1.2 done:** `@fastify/cookie` + `@fastify/jwt` wired after CORS; `JWT_SECRET` guard.
- **Phase 1.3 done:** `POST /api/v1/auth/register` — bcrypt hash, Prisma create, JWT cookie, tested in Postman (201).
- **Phase 1.4 done:** `POST /api/v1/auth/login` — find user, `bcrypt.compare`, JWT cookie, tested (200).
- **Phase 1.6 done:** `GET /api/v1/auth/me` — read cookie, verify JWT, return current user (200).
- **Phase 1.7 done:** `POST /api/v1/auth/logout` — clear cookie; `/me` → 401 after logout.
- **Quiz 4 done** (2026-05-24, strict 4/7).
- **Phase 1b:** `PATCH /auth/me/profile` + `lib/auth.ts` `requireUser`; refactor regression caught and fixed.
- **Phase 1b done:** `GET /api/v1/users` returns public list (`id, username, displayName, avatarUrl`), sorted; tested with 2 users.
- **Phase 2.1 done:** Prisma `Thread` + `Message` models; migration `add_threads_messages`; fixed P1001 (Docker not running).
- **Teaching note:** Prisma relations need **both** models updated — spell out User back-relations every time.
- **Phase 2.2 done:** `POST /api/v1/threads` — `orderUserPair` + `upsert`; tested panos ↔ mitsos thread.
- **Phase 2.3 done:** `POST /threads/:id/messages` — participant check, create message (201); fixed `userHighId` typo.
- **Phase 2.4 done:** `GET /threads/:id/messages` — history for both participants (panos + mitsos).
- **Phase 2.5 done:** `GET /threads` — inbox with peer + `lastMessage`; fixed Prisma `' desc'` typo.
- **Phase 2 API chat MVP complete** (threads + messages, no tasks/WebSocket yet).
- **Next:** React UI for chat, or tasks, or WebSocket realtime.

---

## 6. Quiz schedule

### Rhythm (DECIDED 2026-05-21 — Panos)

| ✅ Allowed | ❌ Not allowed |
|-----------|----------------|
| Finish step(s) → verify → **then** a **quiz-only** message | Quiz questions **and** new step instructions **in one message** |
| **Quiz-only** message → **then** next step in a **separate** message | “Quick quiz” tacked onto the end of a build step |
| Optional: **one extra step**, **then** quiz (e.g. finish 0.11 → Quiz 2) | |

**Who starts the quiz:** Panos says **“let’s do Quiz 2”** (etc.) when ready.

**Rule:** Every **5 completed steps** in §4 → **Quiz N** (5–8 questions). Record in **§7**. If ≥2 wrong, revisit before new steps.

| Quiz | Covers steps | When | Status |
|------|--------------|------|--------|
| **Quiz 1** | 0.0–0.4 | After 0.4 | ✅ done 2026-05-21 |
| **Quiz 2** | 0.5–0.9 | After 0.9 | ✅ done 2026-05-22 |
| **Quiz 3** | 0.10–0.13 | After 0.13 | ✅ done 2026-05-22 (strict grade) |
| **Quiz 4** | Phase 1 auth | After Phase 1 auth works | ✅ done 2026-05-24 |

---

## 7. Quiz results

### Quiz 1 — after step 0.4 (2026-05-21)

**Topics:** `.gitignore`, monorepo, pnpm workspace, `apps/web` vs `apps/api`, dev scripts.

| # | Question | Panos answer (summary) | ✅ / 🟡 |
|---|----------|------------------------|--------|
| 1 | `.env` vs `.env.example` | Example = safe/general, no sensitive stuff | 🟡 |
| 2 | `apps/web` vs `apps/api` | Web = UI; API = backend logic behind the scenes | ✅ |
| 3 | `pnpm-workspace.yaml` | Where packages are located | 🟡 |
| 4 | Start frontend from root | `pnpm dev:web` | ✅ |
| 5 | Why `@panchat/web`? | Root scripts expect that name for filter | 🟡 |

**Score:** **5/5 pass** (3 ✅, 2 🟡 — concepts right, wording can sharpen)

**Sharpen after quiz:**

1. **`.env`** = real secrets on your machine only. **`.env.example`** = committed template (fake values) so others know which variables to set.
2. **`pnpm-workspace.yaml`** = declares which folders are **workspace packages** (`apps/*`), so one `pnpm install` wires the monorepo together — not just “where folders sit on disk.”
3. **`@panchat/web`** = package name must match root script `pnpm --filter @panchat/web dev` so pnpm runs the correct app.

**Follow-up topics:** none blocking — proceed to 0.5.

### Quiz 2 — after step 0.9 (2026-05-22)

| # | Topic | Panos answer | ✅ / 🟡 |
|---|-------|--------------|--------|
| 1 | CSS Modules | More control per element | ✅ |
| 2 | Docker | Container `panchat-db`, Postgres inside | ✅ |
| 3 | Port 5433 | Windows Postgres on 5432, avoid two DBs on same port | ✅ |
| 4 | `.env` vs example | Example = safe template; upload to GitHub unclear | 🟡 |
| 5 | `/health` vs `/health/db` | API alive vs DB connected | ✅ |
| 6 | CORS | Different ports — needs deeper mental model | 🟡 |

**Score:** **6/6 pass** (4 ✅, 2 🟡 — sharpen #4 and #6 below)

**Sharpen #4:** **`.env.example` → YES GitHub.** **`.env` → NEVER GitHub** (secrets).

**Sharpen #6:** CORS = browser permission for cross-origin requests; see chat explanation 2026-05-22.

### Quiz 3 — after step 0.13 (2026-05-22, strict)

| # | Topic | Panos answer | ✅ / 🟡 / ❌ |
|---|-------|--------------|-------------|
| 1 | schema vs migration vs `users` table | Unsure; guessed schema + SQL file | 🟡 |
| 2 | `migrate dev --name` | pnpm tool “creates database” | 🟡 |
| 3 | Port 5433 | Avoid two DBs on same port | ✅ |
| 4 | Two `.env` files | Root secrets; thought `index.ts` uses `apps/api/.env` | ❌ |
| 5 | `/health` vs `/health/db` | DB connected check | ✅ |
| 6 | `lib/prisma.ts` singleton | Don’t know | ❌ |
| 7 | Git commit safety + git vs GitHub | No `.env`; local vs remote | ✅ |

**Score (strict):** **4/7** — concepts OK on 1, 3, 5, 7; **review 2, 4, 6 before Phase 1b** (status codes + `sub` in `/me`).

### Quiz 4 — Phase 1 auth (2026-05-24)

| # | Topic | Panos answer | ✅ / 🟡 / ❌ |
|---|-------|--------------|-------------|
| 1 | bcrypt hash vs compare | Saves password safe/encrypted; compare checks hashed | 🟡 |
| 2 | JWT `sub` + `/me` | Subject yes; `/me` usage unsure | 🟡 |
| 3 | httpOnly cookie | JS can't read easily | ✅ |
| 4 | Status codes A–E | A=200, B=200, C=201, D=401, E=404/409 | ❌ |
| 5 | `/me` flow | cookie → verify → load user by unique id | 🟡 |
| 6 | After logout `/me` | 404 — no token saved | 🟡 |
| 7 | Same login error message | Email missing → password wouldn't exist | 🟡 |

**Sharpen #1:** **Hash ≠ encrypt.** Hash is **one-way** (can't get password back). `bcrypt.compare(plain, hash)` → **`true`** or **`false`**.

**Sharpen #2:** `sub` = **subject** = **user id**. In `/me`: `payload.sub` → `prisma.user.findUnique({ where: { id: payload.sub } })`.

**Sharpen #4:** A=**201**, B=**200**, C=**409**, D=**401**, E=**401** (not 404 — route exists, you're just not logged in).

**Sharpen #6:** Logout **clears cookie** → no token → **401 Not authenticated**. User still in DB.

**Sharpen #7:** Also **security**: same message so attackers can't probe which emails are registered.

---

## 11. Roadmap to portfolio-ready (author plan + brief §17 / §21.2d)

**Order locked** — one small step per session; **git = Panos runs commands** (agent teaches only).

### Wave A — Git checkpoint (Phase 3 web) ✅ **done 2026-05-24** (`f6a335b`)

| Step | What |
|------|------|
| A.1 | `git status` / `git diff` — review changes |
| A.2 | `git add` + `git commit` — web client + chat UI |
| A.3 | `git push origin main` |

### Wave B — Styling pass (in progress)

| Step | Done |
|------|------|
| B.1 App shell layout | [x] |
| B.2 Message bubbles L/R | [x] |
| B.2b Login card | [x] |
| B.3 Responsive | [ ] ← next |
| B.4 Re-test 2 users | [ ] |

| Step | What |
|------|------|
| B.1 | Layout: header, people list, chat panel |
| B.2 | CSS Modules polish |
| B.3 | Responsive phone + desktop |
| B.4 | Re-test panos + incognito mitsos |

### Wave C — Git checkpoint (styling)

Commit + push before new API work.

### Wave D — Missing MVP (brief §8)

| Order | Feature |
|-------|---------|
| D.1 | Register page (web) |
| D.2 | Profile onboarding UI |
| D.3 | Avatar upload API + UI |
| D.4 | Tasks API (recipient-only) |
| D.5 | Tasks UI + My tasks |
| D.6 | WebSocket realtime |
| D.7 | Unread badges (optional) |

### Wave E — Finalize (product / portfolio)

README, LAN phone test, demo checklist (2 users + **task** clear/delete), route refactor, light ESLint.

### Wave F — Git checkpoint (“portfolio MVP”)

### Wave G — Later (v1.1+)

Electron, public GitHub, TLS/E2E encryption per §17.

---

## 8. Open questions from Panos (carry forward)

| Date | Question | Resolved? |
|------|----------|-----------|
| 2026-05-21 | `.env` vs `.env.example` | ✅ yes — see session notes |
| 2026-05-21 | What are `.env.local` / `.env.*.local`? | ✅ yes — local-only overrides, stay ignored |

---

## 9. For a new AI agent (handoff blurb)

> Panos builds **PanChat** himself (§0). **Do not scaffold code** unless he waives it. **Do not run git** unless he asks — give commands (§11 Wave A). **Current:** Phase **3 web chat MVP done**; last push `132d466` (API only). **Roadmap:** §11 / brief §21.2d — git → styling → git → register/avatar/tasks/WS → harden. **Weak spots:** refactors, typos in URLs/Prisma, status codes. **Next step:** Wave A git (Panos runs).

---

## 10. Physical notes — rewind sheet (Phase 0 so far)

Copy this into a notebook to “rewind” the build order.

### A. Big picture (one line each)

| Piece | What it does |
|-------|----------------|
| **apps/web** | React UI (browser, port **5173**) |
| **apps/api** | Fastify server (port **4000**) |
| **Docker `panchat-db`** | PostgreSQL (port **5432**) |
| **`.env`** | Secrets + config (never Git) |
| **`.env.example`** | Template (OK for Git) |

### B. Steps done (checklist)

| Step | What you did | Key files / commands |
|------|----------------|----------------------|
| **0.0** | Git ignore rules | `.gitignore` — ignore `node_modules`, `.env`, `dist` |
| **0.1** | Install pnpm | `npm install -g pnpm` → `pnpm --version` |
| **0.2** | Folder skeleton | `apps/web`, `apps/api` |
| **0.3** | Monorepo root | `package.json`, `pnpm-workspace.yaml` (`apps/*`) |
| **0.4** | React app | `pnpm create vite . --template react-ts` in `apps/web`; name `@panchat/web`; `pnpm dev:web` |
| **0.5** | CSS Modules | `App.module.css` + `styles.className`; global vars in `index.css` |
| **0.6** | Database in Docker | `docker-compose.yml`; `docker compose up -d`; typo `unless-stopped` |
| **0.7** | Environment vars | `.env.example` + `.env`; `DATABASE_URL`; fix `localhost:5173` |
| **0.8** | API package | `apps/api` — Fastify, `index.ts`, `pnpm dev:api`; pnpm `allowBuilds: esbuild: true` |

**Phase 0–2 API done.** See §4 tables for full checklist.

### C. Commands cheat sheet

```text
# Install all packages (root)
pnpm install

# Frontend
pnpm dev:web          → http://localhost:5173

# Backend
pnpm dev:api          → http://localhost:4000

# Database
docker compose up -d    # start
docker compose ps       # status
docker compose down     # stop (data kept)

# Workspace check
pnpm -r list --depth 0

# Prisma (from repo root)
pnpm --filter @panchat/api exec prisma migrate dev --name your_migration_name
pnpm --filter @panchat/api exec prisma generate
pnpm --filter @panchat/api exec prisma studio
```

### C2. Git cheat sheet (Panos runs these)

```powershell
git status
git diff
git add path/to/file
git add .
git commit -m "Short title`n`nOptional body line."
git push origin main
```

**Never commit:** `.env` (secrets). **OK to commit:** `.env.example`, migrations, source code.

**Latest commits:** `af796ae` Phase 0 · `132d466` Phase 1–2 auth + chat API.

### D. Decisions (locked)

- Stack: React + Vite + CSS Modules | Fastify + Prisma + Postgres | Socket.io later
- You write all code; AI edits **only** the two `.md` files
- Host PC can run Docker **and** be client 1 (`localhost`)
- Postman for API tests (Phase 1+)
- Quiz 1–4 ✅ | Quiz 5 after next ~5 steps (UI or tasks) — **separate message from build steps** (Q16)

### E. Phase 1–2 API routes (Postman)

| Method | Path |
|--------|------|
| POST | `/api/v1/auth/register` |
| POST | `/api/v1/auth/login` |
| GET | `/api/v1/auth/me` |
| POST | `/api/v1/auth/logout` |
| PATCH | `/api/v1/auth/me/profile` |
| GET | `/api/v1/users` |
| POST | `/api/v1/threads` body `{ peerUserId }` |
| GET | `/api/v1/threads` |
| GET | `/api/v1/threads/:id/messages` |
| POST | `/api/v1/threads/:id/messages` body `{ body }` |

### F. Fixes you already solved (good to remember)

| Problem | Fix |
|---------|-----|
| `Thumbs.debug` in `.gitignore` | → `Thumbs.db` |
| `unless-unstopped` in Docker | → `unless-stopped` |
| `localhost5173` in `.env` | → `localhost:5173` |
| pnpm ignored esbuild | `pnpm-workspace.yaml` → `allowBuilds: esbuild: true` |
| `onlyBuiltDependencies` in package.json | Ignored in pnpm 11 — use workspace yaml |
| GET on register URL in browser | Use **POST** in Postman |
| `userHighid` vs `userHighId` | Exact casing from Prisma schema |
| `createdAt: ' desc'` | No space — `'desc'` or `'asc'` |
| P1001 migrate | `docker compose up -d` |
| Prisma `Property 'thread' does not exist` | `prisma generate` + restart TS server |

### G. `index.ts` API — 30-second map

1. Load `.env` from repo root  
2. Read `API_HOST`, `API_PORT`  
3. Create Fastify + CORS for `WEB_ORIGIN`  
4. (0.9) Add routes  
5. `app.listen()` — `0.0.0.0` = LAN + localhost  

### H. Quiz 1 takeaways

- `.env` = secrets local | `.env.example` = template on Git  
- `web` = UI | `api` = backend  
- `pnpm-workspace.yaml` = monorepo packages + `allowBuilds`  
- `pnpm dev:web` / `pnpm dev:api`  
- `@panchat/web` matches `--filter`

---

*Update §3–§7 when Panos completes steps or finishes a quiz.*
