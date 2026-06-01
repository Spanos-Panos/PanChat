# PanChat authentication architecture

PanChat uses **your own API + PostgreSQL** (not a hosted auth-only SaaS). That keeps the learning value and full control, while following patterns used in production apps.

## What you have now

| Method | How it works | Security property |
|--------|----------------|-------------------|
| **Email + password** | bcrypt hash, httpOnly JWT cookie | Password never stored plain |
| **Email verification** | Link to inbox (24h token) before login when `AUTH_REQUIRE_EMAIL_VERIFICATION=true` (default in production) | Proves you own the email — stops “I only know their address” takeover |
| **Google sign-in** | OAuth 2.0 redirect → API callback → same session cookie | Google proves identity; email marked verified |
| **Forgot password** | Single-use link to **email** (1h); sessions revoked on change | Same as Gmail-style reset |
| **Sessions** | JWT includes `passwordChangedAt` stamp | Old cookies die after password reset |

## What we did *not* use (and why)

| Option | Tradeoff |
|--------|----------|
| **Clerk / Auth0 / Supabase Auth only** | Fastest to ship, but you learn less about cookies, Prisma users, and your API. Good later if you want to outsource. |
| **Magic-link-only** | No passwords to leak; can add later as another provider. |
| **“Verify email” without blocking login** | Weak — anyone with email + dev link could still register fake accounts. |

## Data model

- **`users`** — one row per person (`email`, optional `passwordHash`, `emailVerifiedAt`)
- **`accounts`** — linked sign-in methods (`credential`, `google`) per user
- **`email_verification_tokens`** / **`password_reset_tokens`** — hashed secrets, expiry, single use

## Environment variables

See root `.env.example`. Important:

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Required in production for reset + verification emails |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Enables “Continue with Google” |
| `API_PUBLIC_URL` | OAuth callback base (e.g. `http://localhost:4000`) |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | `true` / `false` (default: **true** in production, **false** in development) |
| `EXPOSE_DEV_RESET_LINK_IN_UI` | Never on shared machines |
| `EXPOSE_DEV_VERIFY_LINK_IN_UI` | Same — verification link in browser (dev only) |

## Google Cloud setup (one-time)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → **OAuth client ID** (Web).
2. **Authorized redirect URI:** `http://localhost:4000/api/v1/auth/google/callback` (and your production API URL later).
3. Copy Client ID + Secret into `.env`.

## Recommended rollout

1. **Local:** `AUTH_REQUIRE_EMAIL_VERIFICATION=false`, test email/password + Google.
2. **Staging:** Resend + verification `true`, test full flow.
3. **Production:** Resend required, Google optional, never expose dev link flags.

## Future (post-MVP)

- TOTP 2FA for sensitive accounts
- “Sign out all devices” button (bump `passwordChangedAt` or session version)
- Apple / GitHub OAuth (same `accounts` table pattern)
- Optional Clerk migration if you want zero OAuth maintenance
