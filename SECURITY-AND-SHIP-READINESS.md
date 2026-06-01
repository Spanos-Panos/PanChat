# PanChat — Security & ship readiness

Living checklist for taking PanChat from **learning MVP** to something you can **demo, host, and eventually ship** safely.  
Aligned with common “before production” talks (DB exposure, rate limits, injection, privacy, cookies, accessibility).

**How to use this doc**

| Column | Meaning |
|--------|---------|
| **Status** | `done` · `partial` · `planned` · `n/a` |
| **Priority** | `P0` ship-blocker · `P1` soon · `P2` later |

Update status as you implement. Link PRs/commits in the Notes column when useful.

---

## Quick audit (PanChat today)

| Area | Status | Notes |
|------|--------|-------|
| Passwords hashed (bcrypt) | **done** | Never store plain passwords |
| SQL injection via login | **partial** | Prisma uses parameterized queries — not string-concat SQL |
| Auth via httpOnly JWT cookie | **done** | Not in `localStorage` |
| Thread/message authorization | **done** | Participant checks on threads, tasks, deletes |
| Rate limiting | **partial** | `@fastify/rate-limit` — tune per env |
| Input length / validation | **done** | `validate.ts` + UUID checks on id params |
| RLS on Postgres | **n/a** | See §1 — app uses one DB user via Prisma |
| Forgot password | **done** | Email link in prod; dev terminal only; sessions revoked on reset |
| Privacy policy / cookie banner | **partial** | In-app Privacy page + `PRIVACY.md` |
| Account & data deletion API | **partial** | Export JSON + delete account (email confirm) |
| Production HTTPS + secrets | **planned** | Required before public deploy |

---

## 1. Database “open by default” (RLS)

**What people mean:** On Supabase/Postgres, tables can be world-readable without [Row Level Security (RLS)](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

**PanChat reality:**

- You use **PostgreSQL in Docker** + **Prisma** with a single `DATABASE_URL` (app role).
- The **API** is the gatekeeper — browsers never connect to Postgres directly.
- **RLS** matters if clients talk to the DB directly (e.g. Supabase anon key). Here, enforce rules in **API code** (already partly done).

| Priority | Action | Status |
|----------|--------|--------|
| P0 | Never expose `5433` / DB port to the public internet | planned |
| P0 | Strong `DATABASE_URL` password in production; not in git | partial (`.env` gitignored) |
| P1 | Optional: enable RLS + policies if you add Supabase or direct DB access later | n/a |
| P1 | Separate DB role for migrations vs runtime (least privilege) | planned |

---

## 2. Rate limits on endpoints

**Risk:** Brute-force login, register spam, message flood, DoS.

| Priority | Action | Status |
|----------|--------|--------|
| P0 | Global API rate limit (per IP) | partial |
| P0 | Stricter limits on `/auth/login`, `/auth/register` | partial |
| P1 | Rate limit Socket.io events (typing, connect) | planned |
| P2 | Redis-backed limits when running multiple API instances | planned |

**Config:** `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX` in `.env` (see `.env.example`).

---

## 3. Prompt injection

**Risk:** If you add **AI** (summaries, bots, auto-replies), user message text can manipulate the model (“ignore previous instructions…”).

| Priority | Action | Status |
|----------|--------|--------|
| n/a | No AI in PanChat v1 — low risk today | done |
| P1 | When adding AI: treat user content as untrusted; system prompts fixed server-side; no tool access without auth | planned |

---

## 4. Malicious SQL / login without knowing password

**Risk:** Classic `admin' OR '1'='1` style attacks.

| Priority | Action | Status |
|----------|--------|--------|
| P0 | Use Prisma (parameterized) — **never** build SQL from user strings | done |
| P0 | Generic login error: “Invalid email or password” (no “user not found”) | done |
| P1 | Optional: CAPTCHA on register/login after N failures | planned |

---

## 5. Spam / abusive API volume

**Risk:** Automated registration, message spam, avatar upload flood.

| Priority | Action | Status |
|----------|--------|--------|
| P0 | Rate limits (§2) | partial |
| P1 | Max message length + max body size on Fastify | partial |
| P1 | One account per email; username uniqueness | done |
| P2 | Report/block user; admin moderation | planned |

---

## 6. Database + password encryption

| Priority | Action | Status |
|----------|--------|--------|
| P0 | Passwords: **bcrypt** hashes only | done |
| P0 | JWT secret in env, long random string | partial |
| P1 | Postgres encryption at rest (hosting provider / disk) | planned |
| P1 | TLS to Postgres in production | planned |
| P2 | Field-level encryption for highly sensitive data (usually overkill for chat MVP) | planned |

**Note:** “Encrypt the database” on laptop Docker usually means **hosting security + TLS + secrets**, not manual AES on every column.

---

## 7. Crash prevention (emojis, huge input, bad data)

**Risk:** MySQL `utf8` (3-byte) breaks on some emojis — **PostgreSQL `text` is full UTF-8** (4-byte emojis OK).

| Priority | Action | Status |
|----------|--------|--------|
| P0 | Validate max lengths (username, message, task) | partial |
| P0 | Fastify `bodyLimit` for JSON | partial |
| P0 | Global error handler — no stack traces to client in production | partial |
| P1 | Frontend `maxLength` on inputs | planned |
| P1 | Fuzz test: emoji, RTL, zero-width chars in messages | planned |

---

## 8. Can logged-in user A see user B’s data?

**Risk:** IDOR — guessing UUIDs in URLs.

| Priority | Action | Status |
|----------|--------|--------|
| P0 | Every thread/message route checks **participant** | done |
| P0 | Tasks: only **assignee** can update | done |
| P0 | `/users` returns **public** fields only (no email) | done |
| P1 | Audit all new routes with “who can call this?” checklist | planned |
| P1 | Forgot password: time-limited signed tokens | done |
| P1 | Sanitize/validate all write fields | partial |

**Password reset security (2026-05-31):**

| Threat | Mitigation |
|--------|------------|
| Attacker knows email only | **Production:** link emailed via Resend — need **inbox access**. API refuses reset without `RESEND_API_KEY` in production. |
| Attacker on shared dev machine | Dev reset link **not** shown in browser by default (API terminal only). Opt-in: `EXPOSE_DEV_RESET_LINK_IN_UI=true` on private machine only. |
| Victim stays logged in after hijack | `passwordChangedAt` in JWT — **all old cookies and sockets invalidated** on reset. |
| Victim not notified | Email alert when password changes (if Resend configured). |
| Attacker changes password while victim logged in | `POST /auth/me/change-password` requires **current password** (when you add UI). |

---

## 9. Legal, privacy, cookies, accessibility (“vibe coded” liability)

Not legal advice — use as a **dev checklist**; get proper review before a public commercial launch.

### 9a. Privacy policy

| Priority | Action | Status |
|----------|--------|--------|
| P0 | Document: what you collect (email, username, messages, avatars, logs) | planned |
| P0 | Why (account, chat, tasks) | planned |
| P0 | How to request **export** / **delete** account data | planned |
| P1 | `PRIVACY.md` or `/privacy` page linked from app footer | planned |

### 9b. Cookie consent

| Priority | Action | Status |
|----------|--------|--------|
| P0 | Auth cookie is **strictly necessary** for login — explain in policy | planned |
| P1 | If you add analytics (GA, Posthog): banner + opt-in before tracking | planned |
| P1 | No non-essential cookies until consent | planned |

### 9c. Accessibility (a11y)

| Priority | Action | Status |
|----------|--------|--------|
| P1 | Keyboard: focus visible, tab through forms and panels | planned |
| P1 | Labels / `aria-*` on icon-only buttons (panel collapse, send) | partial |
| P1 | Color contrast (WCAG AA) on bubbles and buttons | planned |
| P2 | Screen reader test (NVDA / VoiceOver) on auth + chat | planned |

---

## 10. URLs, logout, and “can I open the backend?”

| Question | Answer for PanChat |
|----------|-------------------|
| If I share a chat URL, can someone else see my messages? | There is **no secret in the URL** — access is the **httpOnly `token` cookie**. Stranger without your cookie: **no**. |
| After logout, can I use the same URL? | Logout **clears cookie** — must log in again. |
| Can I hit `localhost:4000` and see data? | API returns JSON; **no data without valid cookie/JWT**. Don’t expose API port publicly without auth. |
| Avatar URLs like `/uploads/avatars/{userId}.jpg` | **Guessable** if someone knows your user id — treat as semi-public; optional signed URLs later (P2). |

| Priority | Action | Status |
|----------|--------|--------|
| P0 | `httpOnly`, `sameSite`, `secure` cookies in production | partial |
| P1 | Optional: short-lived access token + refresh | planned |
| P2 | Signed URLs for avatars | planned |

---

## 11. Browser security & capabilities

| Priority | Action | Status |
|----------|--------|--------|
| P0 | **HTTPS** in production (Caddy, nginx, Vercel, etc.) | planned |
| P0 | **CORS** only allows `WEB_ORIGIN` | done |
| P1 | Security headers (`@fastify/helmet`) | partial |
| P1 | CSP tuned for Vite dev vs production build | planned |
| P1 | Test Chrome, Firefox, Safari; mobile viewport | partial |
| P2 | `Content-Security-Policy` report-only mode first | planned |

---

## Implementation phases (suggested order)

### Phase A — API hardening ✅ mostly done

- [x] `apps/api/src/lib/validate.ts` — email, password, username, text limits, UUID, birth date
- [x] Rate limiting + helmet + production error handler
- [x] Validators on write routes + UUID on id params
- [x] Env vars in `.env.example`
- [x] Frontend `maxLength` via `apps/web/src/lib/limits.ts`

### Phase B — Auth & account lifecycle ✅

- [x] Forgot password — `forgot-password` + `reset-password` (1h token, Resend required in prod, session revoke)
- [x] `change-password` (current password required) + `passwordChangedAt` JWT stamp
- [x] `POST /api/v1/auth/me/delete` — soft-delete + anonymize + logout
- [x] `GET /api/v1/auth/me/export` — JSON export

### Phase C — Compliance UI (partial)

- [x] In-app Privacy page (`PrivacyPage.tsx`) + `PRIVACY.md`
- [x] Footer link: Privacy policy
- [x] Account menu: export + delete + privacy
- [ ] Cookie banner only if analytics added

### Phase D — Accessibility & polish (started)

- [x] `:focus-visible` rings on interactive elements
- [x] `aria-expanded` / `aria-label` on Account menu and panel toggles
- [ ] E2E smoke tests (login → chat → task done)

### Phase E — Production deploy

- [ ] Managed Postgres (not open port 5433)
- [ ] Secrets in host vault, not `.env` on disk
- [ ] Backups + migration strategy
- [ ] Monitoring (uptime, error rate)

---

## Per-route authorization checklist (copy for new endpoints)

Before merging any new API route, answer:

1. Who must be logged in?
2. Can user A pass user B’s `id` and read/write their data?
3. Max input size and allowed characters?
4. Should this be rate-limited?
5. What is logged — any PII in logs?

---

## Related files

| File | Purpose |
|------|---------|
| `apps/api/src/lib/validate.ts` | Shared validation |
| `apps/api/src/lib/auth.ts` | Session / `requireUser` |
| `apps/api/src/index.ts` | Routes + security plugins |
| `.env.example` | Secrets and rate limit tuning |
| `thread-task-chat-brief.md` | Product scope |
| `panchat-learning-journal.md` | Learning log |

---

*Last updated: 2026-05-31 — Password reset hardened (email-only in prod, no browser link in dev by default, session revoke).*
