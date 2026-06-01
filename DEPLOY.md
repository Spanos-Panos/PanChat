# PanChat — production deploy guide

PanChat is **ready for a first public deploy** as a portfolio app, with a few hosting constraints you should understand up front.

## Can everything go on Vercel?

| Part | Vercel? | Why |
|------|---------|-----|
| **Web** (React) | **Yes** | Static build from `apps/web` |
| **API** (Fastify + Socket.io) | **No** (not as one serverless app) | WebSockets need a **long-running** Node process; avatar files need **disk or object storage** |
| **PostgreSQL** | **No** (use a DB host) | Use **Neon**, **Supabase**, or **Railway Postgres** |

**Recommended beginner stack**

```text
Vercel          →  https://panchat.vercel.app     (frontend)
Railway/Render  →  https://api.yourdomain.com     (API + Socket.io)
Neon            →  Postgres connection string      (DATABASE_URL)
Resend          →  verify + reset emails
Google Cloud    →  OAuth (add production redirect URI)
```

All of these have free tiers suitable for a portfolio demo.

---

## Pre-deploy audit (2026-05)

### Ready

- Auth: bcrypt, httpOnly cookies, email verify, Google OAuth, session revoke on password change
- Authorization: thread/task participant checks
- Validation + rate limits + helmet + production error masking
- Privacy page, export/delete account
- Responsive CSS (`@media max-width: 768px`), viewport meta tag
- Cross-browser stack: React, fetch, CSS Modules, Socket.io client (Chromium, Firefox, Safari, Edge)

### Fix or plan before serious traffic

| Issue | Risk | Action |
|-------|------|--------|
| **Avatars on local disk** (`apps/api/uploads`) | Lost on redeploy on Railway/Render unless volume mounted | Use persistent volume **or** S3/R2 later; OK for demo if you accept re-upload after deploy |
| **JWT_SECRET** short/default | Session forgery | Generate 32+ random chars in host secrets |
| **Google redirect URI** | OAuth fails in prod | Add `https://your-api.../api/v1/auth/google/callback` |
| **Resend `MAIL_FROM`** | Emails blocked | Verify domain in Resend; not `@resend.dev` for production |
| **Cross-origin cookies** | Login works locally but not when web ≠ API domain | Set `COOKIE_CROSS_SITE=true` + HTTPS (see below) |
| **Change password UI** | Missing | API exists; optional before deploy |

---

## Browser & phone compatibility

PanChat does **not** need a separate build per browser. One web app works everywhere that runs modern JavaScript.

| Browser | Expected |
|---------|----------|
| **Chrome / Edge / Brave / Opera** | All Chromium — behave like Chrome; primary test target |
| **Firefox** | Supported; test login + chat once before demo |
| **Safari** (Mac/iPhone) | Supported; test cookies + chat (ITP is stricter — use HTTPS in prod) |

| Device | Expected |
|--------|----------|
| **Desktop** | Full 3-panel layout |
| **Phone browser** | Responsive layout at ≤768px; use **deployed HTTPS URL**, not `localhost` on the phone |
| **Tablet** | Same as phone layout |

**You should still manually test** (15 minutes): Chrome + one non-Chromium (Firefox) + phone Safari or Chrome on your **deployed** URL.

---

## Environment variables (production)

Set these in **Railway/Render** (API) and **Vercel** (web). Never commit real values.

### API host

```env
NODE_ENV=production
DATABASE_URL=postgresql://...neon.tech/...?sslmode=require
JWT_SECRET=<64-char-random>
API_HOST=0.0.0.0
# Local only — Railway injects PORT; do not set API_PORT on Railway
API_PUBLIC_URL=https://your-api.up.railway.app
WEB_ORIGIN=https://your-app.vercel.app
AUTH_REQUIRE_EMAIL_VERIFICATION=true
RESEND_API_KEY=re_...
MAIL_FROM=PanChat <noreply@yourdomain.com>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
COOKIE_CROSS_SITE=true
TRUST_PROXY=true
```

### Vercel (web)

```env
VITE_API_URL=https://your-api.up.railway.app
```

---

## Deploy steps (overview)

Repo includes `railway.toml`, `nixpacks.toml` (API), and `vercel.json` (web) at the project root.

**Railway note:** `NODE_ENV=production` is correct at **runtime**, but the build must still install TypeScript — the repo puts `typescript` in API `dependencies` so `tsc` is available during deploy.

### 1. Postgres (Neon)

1. Create project at [neon.tech](https://neon.tech).
2. Copy **connection string** → `DATABASE_URL`.
3. Locally: `cd apps/api && pnpm exec prisma migrate deploy` against that URL (once) to apply schema.

### 2. API (Railway example)

1. New project → deploy from GitHub repo.
2. **Root directory** or custom: build `apps/api`.
3. **Build command:**

   ```bash
   pnpm install && cd apps/api && pnpm exec prisma generate && pnpm exec prisma migrate deploy && pnpm build
   ```

4. **Start command:**

   ```bash
   cd apps/api && node dist/index.js
   ```

5. Add all API env vars above.
6. Enable **public networking** → note HTTPS URL → set `API_PUBLIC_URL` and update `WEB_ORIGIN` on Vercel to match.

### 3. Web (Vercel)

1. Import GitHub repo on [vercel.com](https://vercel.com).
2. **Root directory:** leave as repo root (uses `vercel.json`).
3. Env: `VITE_API_URL` = `https://your-api.up.railway.app` (no trailing slash).
4. Deploy → copy `https://….vercel.app`.
5. On Railway, set `WEB_ORIGIN` to that Vercel URL and redeploy API.
6. On Vercel, enable `COOKIE_CROSS_SITE=true` on API (Railway env) — required when web and API are different domains.

### 4. Google OAuth (production)

In Google Cloud → Clients → add redirect URI on the **API** host (Railway), not Vercel:

```text
https://your-api.up.railway.app/api/v1/auth/google/callback
```

(Local dev uses port **5173** via Vite proxy — see LAN section below.)

### 5. Smoke test (production)

- [ ] Register → verify email (inbox on real device works with HTTPS URL)
- [ ] Login / Google sign-in
- [ ] Two users → message appears live
- [ ] Task attach → recipient clears
- [ ] Avatar upload (note: may reset after redeploy until S3)

---

## LAN / phone + laptop together (local, not production)

Use **both** URLs at once — no switching `.env` when you move between devices.

**Root `.env`:**

```env
WEB_ORIGIN=http://192.168.1.5:5173,http://localhost:5173
API_PUBLIC_URL=http://192.168.1.5:4000
```

**Do not set `VITE_API_URL`** in `apps/web/.env` — Vite proxies `/api` to port 4000 so cookies work on both URLs.

| Device | Open in browser |
|--------|------------------|
| Laptop | `http://localhost:5173` **or** `http://192.168.1.5:5173` |
| Phone (same Wi‑Fi) | `http://192.168.1.5:5173` |

Run: `pnpm dev:api` and `pnpm --filter @panchat/web dev -- --host`. Restart both after `.env` changes.

**Why this matters:** If the laptop uses `localhost:5173` but API calls go to `192.168.1.5:4000`, the session cookie is not sent → “not authenticated” and empty People list. The proxy fixes that.

Phone health check: `http://192.168.1.5:4000/health` → `{"ok":true}`.

### Google sign-in on phone (LAN)

In Google Cloud → **Clients** → your OAuth client → **Authorized redirect URIs**, add **both** (port **5173**, Vite proxy):

```text
http://localhost:5173/api/v1/auth/google/callback
http://192.168.1.5:5173/api/v1/auth/google/callback
```

(Replace `192.168.1.5` with your Wi‑Fi IP.) Restart API after saving. If Google rejects a private IP, use **email/password on the phone** and Google on the laptop only — production HTTPS fixes Google on all devices.

---

## Later: Electron `.exe` (Phase 9)

The `.exe` wraps the **same web UI** pointing at your deployed API URL — it does not replace hosting. Do this **after** production web works.

---

## Public GitHub repo

When ready:

1. Rotate any secret that ever lived in chat/commits (Resend, Google, JWT).
2. Confirm `.env` is gitignored.
3. Make repo public; README + demo video link.

---

## Related docs

- [SECURITY-AND-SHIP-READINESS.md](./SECURITY-AND-SHIP-READINESS.md) — security checklist
- [AUTH-ARCHITECTURE.md](./AUTH-ARCHITECTURE.md) — auth flows
- [README.md](./README.md) — local dev + demo script
