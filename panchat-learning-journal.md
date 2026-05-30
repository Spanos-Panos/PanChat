# PanChat — Learning Journal (Panos)

> **Companion to:** [`thread-task-chat-brief.md`](./thread-task-chat-brief.md) (product spec, stack, MVP scope)  
> **Purpose:** Track **how Panos learns**, what he knows / is learning / is weak on, session notes, and **quizzes** — so any AI agent or future you can continue teaching without starting from zero.  
> **Last updated:** 2026-05-30  
> **Phase:** **MVP feature-complete** — auth, profile, avatars, tasks, **Socket.io live chat**. **Next:** Wave E (git checkpoint, demo video, portfolio README).

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
| **Testing preference (2026-05-30)** | Prefers **two-browser UI tests** (normal + incognito) over DevTools/Console; willing to learn F12 slowly, not every session |
| **Energy / pace** | Can burn out on long multi-file steps — OK to ask agent to **implement** when explicitly waived; prefers **one small step** when learning |

---

## 1b. Honest assessment (agent notes — 2026-05-30)

*Strict but fair. Update when reality changes.*

### What is genuinely strong

| Area | Why |
|------|-----|
| **React / UI thinking** | Forms, `useState`, `useEffect`, conditional screens (login vs profile vs chat) — you ship working UI faster than most beginners |
| **Persistence** | You come back after breaks, run Docker/API/web, and finish milestones (register, profile, tasks E2E) |
| **Engineering mindset** | You ask *why* (`.env`, CORS, 401 on `/me`) instead of only copy-pasting |
| **Multi-user testing** | Incognito second user is now a habit — critical for chat + tasks |
| **Corrections** | Typos and wrong `if` logic get fixed when pointed at logs/schema — you don’t argue with the compiler |

### What is real but still “learning” (not weak — in progress)

| Area | Truth |
|------|--------|
| **Node / Fastify API** | You **wrote** most of `index.ts` (~580 lines) with teaching — auth, threads, messages, tasks. You are not “bad at backend”; you are **early** backend. Portfolio claim: *built* API, not *expert* API |
| **Prisma** | Schema + migrations work when walked through; relations still need “both sides on `User`” reminders; `prisma generate` + **stop API first** on Windows (EPERM) |
| **HTTP** | Quiz 4 showed status-code gaps; real world improved (401 vs 404, PATCH vs POST). Keep a **cheat sheet** in notebook |
| **CORS** | Learned the hard way: **PATCH** must be in `access-control-allow-methods` — classic cross-origin gotcha |
| **Git** | You want to **run commands yourself** — good. Remember: `pnpm dev:api` / `docker compose` from **repo root**, not `apps/api` (scripts live on root `package.json`) |
| **Refactors** | `requireUser` extract, missing `})` on routes, duplicate `setMessages` — pattern: **small diff → save → re-test same flow** |

### What is still weak / unfamiliar (be honest in interviews)

| Area | Level | Plan |
|------|--------|------|
| **Browser DevTools** | 🔴 early | Network tab for status codes when UI “looks broken”; not required every day if UI test passes |
| **Socket.io** | ⬜ not started | Next big learn after avatar |
| **Multipart / file upload** | ⬜ not started | Avatar (D.3) |
| **Automated tests** | ⬜ | Optional in Wave E; manual E2E is OK for portfolio v1 |
| **System design vocabulary** | 🟡 | You understand flows; naming (ACL, assignee, upsert) comes with repetition |

### Progress snapshot (portfolio honesty)

| Milestone | Status |
|-----------|--------|
| Phase 0 monorepo + Docker + Prisma | ✅ |
| Phase 1–2 API auth + chat | ✅ `132d466` era |
| Phase 3 web chat | ✅ `f6a335b` |
| Wave B styling | ✅ `956d3f8` |
| Wave D register + profile | ✅ (web) |
| Wave D tasks API + UI | ✅ **2026-05-30** (may be **uncommitted** — run git checkpoint) |
| Avatar | ⬜ **next (Panos chose before WebSocket)** |
| WebSocket live chat | ⬜ |
| README + demo video | ⬜ Wave E |

**Rough completion:** ~**70%** functional MVP · ~**55%** portfolio-ready (needs README, demo, optional LAN phone test).

### How the next agent should teach Panos

1. **One step per message** unless he says “I’m burnt out — implement X.”  
2. **UI test checklist** > long DevTools lectures (he asked for this explicitly).  
3. After any refactor: **“re-open thread and send one message”** before new routes.  
4. **Git:** give PowerShell commands; he runs them.  
5. **Quiz 5** when he says ready — topics: tasks recipient-only, CORS methods, Prisma `Task` relations (separate message from build steps).

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
| 2026-05-30 | CORS allowed POST but not PATCH → profile/tasks “Failed to fetch” | Add `methods` including **PATCH** on `@fastify/cors`; restart API |
| 2026-05-30 | `prisma generate` EPERM on Windows | **Stop `pnpm dev:api`** first, then `pnpm exec prisma generate` |
| 2026-05-30 | `pnpm dev:api` from `apps/api` fails | Root only: `pnpm dev:api` or in `apps/api`: `pnpm dev` |
| 2026-05-30 | Long D.5 UI step → burnout | Split steps; agent may edit `App.tsx` when Panos **explicitly asks** |

---

## 3. Skills map (living document)

**Legend:** ✅ confident · 🟡 learning · 🔴 weak / not yet · ⬜ not started

| Topic | Level | Evidence / notes |
|-------|-------|------------------|
| Git / GitHub | 🟡 | `af796ae` · `132d466` · `f6a335b` · `956d3f8` — Panos runs commit/push; **tasks wave may need new commit** |
| pnpm / monorepo | 🟡 | Quiz 1: knows `dev:web` + `@panchat/web`; deepen workspace YAML meaning |
| `.env` / secrets | 🟡 | Asked strong questions; fixed `Thumbs.db` typo after review |
| React + Vite | 🟡 | Vite 8 + React 19 in `apps/web`; dev server verified |
| CSS Modules | 🟡 | Clean shell; `App.module.css` + global `index.css` variables |
| Docker / Compose | 🟡 | `panchat-db` Up on 5432; fixed `unless-stopped` typo from error message |
| PostgreSQL | 🟡 | Docker DB `panchat` on port **5433** (Windows Postgres on 5432) |
| Prisma | 🟡 | `User`, `Thread`, `Message`, **`Task`** + `TaskStatus`; migration `add_task`; generate with API stopped |
| Fastify / Node HTTP | 🟡 | Auth + chat + **tasks** (~580 lines); CORS must list PATCH |
| JWT / cookies | 🟡 | Register/login set httpOnly cookie; `/me` verifies `sub`; 401 on `/me` when logged out is **normal** |
| Tasks (recipient-only) | 🟡 | Built API + UI; understands assignee vs sender; UI test > Console |
| Socket.io | ⬜ | After avatar (author order 2026-05-30) |
| Postman | 🟡 | Phase 1–2 heavy; Phase D often **browser-only** — both OK |
| Browser DevTools | 🔴 | Learning Network/Console when needed; prefers incognito UI tests |
| LAN / host vs client | 🟡 | Understands host + same laptop as client 1 (Q12) |
| TypeScript (backend) | 🟡 | `index.ts` ~579 lines; `lib/auth.ts`; route `})` closures easy to miss |
| React (features) | 🟡 | Register, profile gate, tasks composer, My tasks, Clear/Delete — **strongest recent work** |

### Weak spots to watch (update as we go)

- Backend **confidence** (skill is growing; impostor feeling is normal)
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

### Phase 3 — Web client (continued)

| Step | Done | Date | One-line note |
|------|------|------|----------------|
| 3.1–3.6 | [x] | 2026-05-24 | `apiFetch`, login, `/me`, users, thread, messages, logout — `f6a335b` |

### Wave B — Styling

| Step | Done | Date | One-line note |
|------|------|------|----------------|
| B.1–B.4 | [x] | 2026-05-24 | Shell, bubbles, auth card, responsive — `956d3f8` |

### Wave D — MVP features

| Step | Done | Date | One-line note |
|------|------|------|----------------|
| D.1 Register (web) | [x] | 2026-05-30 | `authView` login/register |
| D.2 Profile onboarding | [x] | 2026-05-30 | PATCH profile; CORS PATCH fix |
| D.4 Tasks API | [x] | 2026-05-30 | Prisma `Task`; POST/GET/PATCH/inbox; recipient-only shaping |
| D.5 Tasks UI | [x] | 2026-05-30 | Attach task, panel, Clear/Delete, My tasks sidebar; agent helped when burnt out |
| D.3 Avatar | [ ] | — | **Next** (before WebSocket per Panos) |
| D.6 WebSocket | [ ] | — | After avatar |
| D.7 Unread (optional) | [ ] | — | Skip unless time |

---

## 5. Session log (newest first)

### 2026-05-30 — Wave D: profile, tasks API + UI

- **D.2 profile:** Register + onboarding UI; **CORS** missing PATCH → “Failed to fetch” on profile save; fixed in `index.ts` `methods`.
- **D.4 Prisma:** `Task` model, migration `add_task`; `prisma generate` EPERM → stop API, regenerate.
- **D.4 API:** POST message + optional task; GET messages shaped (`task` vs `hasTask`); inbox + PATCH clear/delete.
- **D.5 web:** Attach task, sender hint, recipient panel + actions, My tasks list; duplicate `setMessages` + missing composer fixed; agent implemented bulk of D.5 when Panos burnt out (**explicit ask**).
- **Teaching:** DevTools intro (401 on `/me`, Strict Mode double call); Panos prefers **UI testing** going forward.
- **Decision:** **Avatar (D.3) before WebSocket (D.6)**.
- **Git:** Panos should commit tasks + register/profile + CORS — may not be on `main` yet.

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
| **Quiz 5** | Wave D: tasks, CORS PATCH, Prisma Task | When Panos says ready | ⬜ pending |

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

### Wave B — Styling pass ✅ done 2026-05-24 (`956d3f8`)

| Step | Done |
|------|------|
| B.1 App shell layout | [x] |
| B.2 Message bubbles L/R | [x] |
| B.2b Login card | [x] |
| B.3 Responsive | [x] |
| B.4 Re-test + git (Panos) | [x] `956d3f8` pushed |

### Wave C — Git checkpoint (tasks + profile) ← **do soon**

| Step | What |
|------|------|
| C.1 | `git status` / `git diff` — review API + web |
| C.2 | Commit: register, profile, tasks API/UI, CORS PATCH |
| C.3 | `git push origin main` |

### Wave D — Missing MVP (brief §8)

| Order | Feature | Status |
|-------|---------|--------|
| D.1 | Register page (web) | ✅ |
| D.2 | Profile onboarding UI | ✅ |
| D.4 | Tasks API (recipient-only) | ✅ |
| D.5 | Tasks UI + My tasks | ✅ |
| D.3 | Avatar upload API + UI | ✅ |
| D.6 | WebSocket + live avatar (`user:updated`) | ✅ |
| D.7 | Unread badges (optional) | skip |

### Wave E — Portfolio finalize ← **next**

| Step | What |
|------|------|
| E.1 | Git commit + push (full MVP) — **Panos runs** |
| E.2 | Record demo video (README checklist) |
| E.3 | Optional: LAN phone test |
| E.4 | Optional: public GitHub repo |

### Wave F — Later (v1.1+)

Electron `.exe`, TLS/E2E encryption per §17.

---

## 8. Open questions from Panos (carry forward)

| Date | Question | Resolved? |
|------|----------|-----------|
| 2026-05-21 | `.env` vs `.env.example` | ✅ yes — see session notes |
| 2026-05-21 | What are `.env.local` / `.env.*.local`? | ✅ yes — local-only overrides, stay ignored |

---

## 9. For a new AI agent (handoff blurb)

> Panos builds **PanChat** himself (§0). **Current (2026-05-30):** MVP **feature-complete** — tasks, avatars, Socket.io live chat. **Next:** Wave E git + demo video. **Panos runs git.** **Teach:** one step, UI tests. **Watch:** avatar URL cache bust, `App.tsx` vs `index.ts`, CORS PATCH.

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

**Latest commits:** `af796ae` Phase 0 · `132d466` API auth+chat · `f6a335b` web chat · `956d3f8` styling · **(pending)** tasks/profile/register.

### D. Decisions (locked)

- Stack: React + Vite + CSS Modules | Fastify + Prisma + Postgres | Socket.io later
- You write all code; AI edits **only** the two `.md` files
- Host PC can run Docker **and** be client 1 (`localhost`)
- Postman for API tests (Phase 1+)
- Quiz 1–4 ✅ | **Quiz 5** = tasks + CORS PATCH (when Panos ready) — **separate message** (Q16)
- **Avatar before WebSocket** (2026-05-30)

### E. API routes (Postman or UI)

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
| POST | `/api/v1/threads/:id/messages` body `{ body, task?: { body } }` |
| GET | `/api/v1/tasks/inbox` optional `?status=open` |
| PATCH | `/api/v1/tasks/:id` body `{ status: 'cleared' \| 'deleted' }` assignee only |

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
| Profile/tasks “Failed to fetch” | CORS `methods` include **PATCH** |
| `pnpm dev:api` not found in `apps/api` | Use repo root `pnpm dev:api` or `apps/api` → `pnpm dev` |
| Missing `})` after route handler | Close `app.post` before next `app.get` |

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

*Update §1b, §3–§7, §11 when Panos completes steps, finishes a quiz, or changes priorities.*
