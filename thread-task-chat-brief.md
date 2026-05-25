# PanChat — Project Master Brief

> **Status:** Specification complete — **author-led build in progress** (Q1–Q13 decided)  
> **Product name:** **PanChat** (author: Panos — chosen for fun/personal brand)  
> **Author:** Panos, 21, self-taught developer  
> **Last updated:** 2026-05-24 (Phase 1–2 API done; git teaching note)  
> **Purpose of this document:** Single source of truth for any AI agent or human collaborator guiding design, implementation, and portfolio delivery of this project.

---

## 0. Collaboration mode (DECIDED Q13 — non‑negotiable unless author changes it)

| Role | Responsibility |
|------|----------------|
| **Author (Panos)** | Writes **all** code, runs **all** terminals, creates **all** project files and folders. Goal: understand every layer — not “vibe coding.” |
| **AI agent** | Acts as **teacher + reviewer + spec keeper**. Explains concepts, gives **step-by-step instructions**, answers questions, reviews author’s code when asked. |
| **Files the agent may edit** | **`thread-task-chat-brief.md`**, **`panchat-learning-journal.md`**, **`README.md`** (docs only; author requested README help). |
| **Agent must NOT** | Create, edit, or delete application code (`apps/`, `docker-compose.yml`, etc.) unless the author **explicitly** asks for an exception in that chat message. |

**How a session should work:**

1. Author says what they’re working on (e.g. “Phase 0 step 3”).
2. Agent explains **what** and **why**, then gives **one small step** (command or file to create — author runs/types it).
3. Author tries it, reports result or pastes errors.
4. Agent helps debug in chat; when a milestone is done, author asks agent to **update §21.2** here and **`panchat-learning-journal.md` §4–§5**.
5. Every **5 steps** (journal §6): **quiz in its own message** — never mixed with new build steps. Order: **quiz then step**, or **one more step then quiz**; author triggers quiz when ready.
6. **Git / GitHub (2026-05-24):** Author wants to **run** `git status`, `add`, `commit`, `push` himself to learn. Agent **lists commands and explains**; agent runs git only if author explicitly asks in that message.
7. **UI polish (2026-05-24):** Build **functionality first** (auth → chat flow). Dedicated pass later for layout, CSS Modules polish, **responsive phone + desktop** (brief §10.8 still applies before portfolio demo).

---

## How to use this document (for AI agents)

1. Read **§0** first — **author implements;** agent may edit **`thread-task-chat-brief.md`** + **`panchat-learning-journal.md`** only.
2. Read **§1–§7** for goals, constraints, and user-provided answers.
3. Treat **§8** as the locked MVP scope unless the author explicitly changes it.
4. Use **§12–§14** for implementation reference (schema, API, stack) — **do not scaffold for the author.**
5. Track decisions in **§19**; do not invent features listed in **§9** without author approval.
6. When suggesting work, prefer the **milestone order in §17** and the **author checklist in §21.2**.
7. **All core decisions locked (Q1–Q13).** Ship **web first** → **`.exe` later** → **public repo optional later**; test on **phone + laptop** same WiFi (§10.8, §19).

---

## Table of contents

0. [Collaboration mode (Q13)](#0-collaboration-mode-decided-q13--nonnegotiable-unless-author-changes-it)
1. [Executive summary](#1-executive-summary)
2. [Author background and motivation](#2-author-background-and-motivation)
3. [Origin story — what triggered this project](#3-origin-story--what-triggered-this-project)
4. [Prior portfolio context](#4-prior-portfolio-context)
5. [Career context — full stack title](#5-career-context--full-stack-title)
6. [Project goals and non-goals](#6-project-goals-and-non-goals)
7. [Discovery answers (author-provided)](#7-discovery-answers-author-provided)
8. [Functional requirements — MVP](#8-functional-requirements--mvp)
9. [Functional requirements — post-MVP](#9-functional-requirements--post-mvp)
10. [Deployment and the USB install problem](#10-deployment-and-the-usb-install-problem)
11. [Security and privacy](#11-security-and-privacy)
12. [Draft data model](#12-draft-data-model)
13. [Draft API surface](#13-draft-api-surface)
14. [Recommended tech stack](#14-recommended-tech-stack)
15. [Architecture options and recommendation](#15-architecture-options-and-recommendation)
16. [UI and UX direction](#16-ui-and-ux-direction)
17. [Milestone plan](#17-milestone-plan)
18. [Risks and mitigations](#18-risks-and-mitigations)
19. [Open questions log](#19-open-questions-log)
20. [Conversation and decision history](#20-conversation-and-decision-history)
21. [Next actions](#21-next-actions)
22. [Appendices](#22-appendices)

---

## 1. Executive summary

**PanChat** is a **simple messaging application** inspired by an internal tool observed during a municipality internship: **one-to-one chat** where each message can optionally include **one simple task** displayed in a subpanel.

| Dimension | Choice |
|-----------|--------|
| **Product name** | **PanChat** |
| Primary purpose | **Learning** and **portfolio / showcase** |
| Target audience | Generic users (simple UX), **not** a municipality-specific product |
| MVP scope | Email/password auth, post-signup profile setup, 1-1 chat, recipient-only tasks, database |
| Stretch goals | Encrypted messages, LAN-friendly install so multiple Windows PCs can use the app |
| Deployment | **Web first** on WiFi LAN; **Electron `.exe` after web works** — see §10 |
| Repository | **Private** until portfolio-ready; public GitHub optional later (§19 Q7) |
| Testing | **Phone + laptop** on same WiFi (mobile browser); fallback: 2nd laptop or VM (§10.8) |
| Task visibility | **Recipient-only** — both see the message; only the receiver sees and manages the task |

**MVP philosophy:** Smaller and clearer than Slack or Teams. Text-only **messages** (no chat file attachments). Profile **avatar** upload allowed. No departments. No notifications in v1.

---

## 2. Author background and motivation

| Item | Detail |
|------|--------|
| Age | 21 |
| Education | Completed **Computer Applications Technician (multimedia)** at a public **IEK** (vocational school) in Greece |
| Internship | **6-month internship** at a **municipality office** — ending in approximately **3 days** (as of 2026-05-19) |
| Work during internship | Effectively **not doing development work** there |
| Available time | **Significant free time** after internship ends |
| Self-image | Programmer / aspiring software engineer |
| Current driver | Has time and curiosity; wants a **portfolio-grade full-stack project** that proves end-to-end skills |

---

## 3. Origin story — what triggered this project

### 3.1 What was observed (second-hand)

A **senior colleague** distributed software via **USB flash drive** to employee computers.

**Critical clarification from the author:**

> The USB was used **only to install the application** on each PC. After installation, the USB was removed. Anyone who wanted the app had to use the USB to run the installer.

Reported behavior (heard, not fully seen):

1. User installs the app (via USB).
2. User **registers** → automatically appears on a **global user list**.
3. Any user can select another user (e.g. “Giorgos”) and send a **text message**.
4. A message can include an attached **task**, for example:
   - Message: `"hi"`
   - Task: `"check this email and add a digital signature"`
5. When Giorgos opens the conversation, he sees:
   - The message
   - A **subpanel** showing the task
6. Colleagues **liked it** — validates the core UX.

### 3.2 What the original tool apparently does NOT have

| Feature | Present in original? |
|---------|---------------------|
| Documents / images in chat | **No** — text only |
| Logs / backup (author believes) | **No** |
| Desktop / push notifications | **No** |
| Complex task workflow | **No** / minimal |
| Departments / org groups | Unknown — author wants **none in MVP** |

### 3.3 Author’s hypothesis and intent

- Original **frontend may be mediocre** → author believes they can deliver **better UI/UX**.
- Build own version for **learning**, not to politically replace the colleague’s tool at the internship.
- Product should be **generic** (“for everyone”), **not** production-targeted at municipality level for v1.

---

## 4. Prior portfolio context

Reviewed workspace: `Desktop/Programming` (projects on current laptop). More work may exist on other machines.

### 4.1 Strongest existing projects

| Project | Stack | Assessment |
|---------|-------|------------|
| **ReactBitsAntigravity** | Electron + React + TypeScript + AI APIs + Three.js | **Best portfolio piece** — real product complexity, lint/typecheck/tests, published to GitHub (`Spanos-Panos/ReactBitsLibrary`) |
| **PianoTilesBot** | Android / Kotlin | **Second best** — large non-tutorial app (screen capture, tile detection, accessibility services, Compose UI) |

### 4.2 Incomplete or learning-tier projects

| Project | Notes |
|---------|-------|
| **NoteForge** | Next.js + Supabase auth + UI; backend Prisma schema **empty**, API mostly boilerplate — not end-to-end |
| **EmployeeSystem** (Learn) | React CRUD frontend calling `localhost:5000` — **no backend present on this machine** |
| **Learn/** | Tutorials, duplicates, ML Streamlit tooling |
| **Tests/** | Small experiments — weak hiring signal alone |

### 4.3 Why this new project matters strategically

This app can become the **first clean full-stack proof** if delivered with:

- Authentication
- Database persistence
- Messaging between users
- Task entity linked to messages
- Documented run/deploy story (local Docker minimum; LAN install as stretch)

---

## 5. Career context — full stack title

### 5.1 Can the author call themselves “Full Stack Software Engineer” today?

| Claim | Supported today? |
|-------|------------------|
| Works on frontend and has touched backend | **Yes** |
| Production-ready full stack engineer (hire-ready) | **Not yet proven** — needs one complete end-to-end shipped app |
| **Junior Frontend Developer** / **Software Developer** | **Most accurate** current title |
| **Junior Full Stack Developer** | **Achievable after this project ships** with README + demo |

### 5.2 How this project helps the resume

If completed with backend + DB + auth + messaging + tasks + README + demo video:

> Built a lightweight internal messaging app with inline tasks (React, Node, PostgreSQL, WebSockets, JWT, encryption scope TBD).

---

## 6. Project goals and non-goals

### 6.1 Goals

| Priority | Goal |
|----------|------|
| P0 | **Learn** full-stack product development |
| P0 | **Portfolio / showcase** with README, screenshots, demo video |
| P1 | Auth + global user list + 1-1 chat + optional single task per message |
| P1 | Database-backed persistence |
| P2 | **Encrypted messages** (exact layer TBD — see §19) |
| P2 | Understand **Windows install + LAN multi-PC usage** |
| P3 | UI clearly better than “mediocre” reference — but **simple**, not flashy |

### 6.2 Non-goals (explicit — do not add to MVP without approval)

| Non-goal | Reason |
|----------|--------|
| Municipality production rollout in v1 | Legal / IT / GDPR; author wants generic learning product |
| Group chat | Deferred |
| Departments / org structure | Deferred |
| File or image attachments | Reduce scope; match reference simplicity |
| Task reply threads, due dates, reassignment | Keep task model dumb-simple |
| Complex task states beyond minimal clear/delete | v2 at earliest |
| Push or desktop notifications | v2 |
| Replacing colleague’s tool at internship workplace | Learning / portfolio only |

---

## 7. Discovery answers (author-provided)

| # | Topic | Answer |
|---|-------|--------|
| 1 | **Purpose** | Mainly **learning + portfolio**. Not municipality-specific. Wants **auth, encrypted messages, database**. Wants each PC to **install and have the app work** — **author is worried** about this (no prior experience). |
| 2.1 | **Users** | Think **“users”**, not “employees” — **simple use** |
| 2.2 | **Chat type** | **1-1 only** for v1 |
| 2.3 | **Departments** | **No** for v1 |
| 3.1 | **Tasks per message** | **Exactly one task** per message (when attached) |
| 3.2 | **Task status** | Something simple would be nice — **keep it light** |
| 3.3 | **Task interaction** | **No** reply thread on tasks. User sees task on their machine; can **Clear** or **Delete** when done (or not) |
| 4.1 | **Auto user list on register** | **Yes** |
| 4.2 | **Admin approval for new users** | **No** |
| 4.3 | **Account lifecycle** | User can **delete own account**. For higher security, someone with **database access** can delete users directly (documented admin procedure) |
| 5.1 | **Network environment** | Not closely observed. Municipality has **server + ethernet**; possibly a **router-like device** connected via USB to one PC |
| 5.2 | **Client OS** | **All Windows** |
| 5.3 | **Server always-on vs portable** | **Unknown** — key open decision |
| 6.1 | **Attachments** | Original is **text only** — MVP follows text only |
| 6.2 | **Logs / backup** | Original likely has none — may add later |
| 7 | **Notifications** | Original has none — **skip in v1** |
| 8 | **MVP one-liner** | See §8.7 (PanChat) |
| 11 | **Auth (Q4)** | **Email + password** for sign up and sign in |
| 12 | **Profile after signup** | After successful register → onboarding: username, birth date, profile picture, etc. |
| 13 | **Release order (Q7)** | Web works first → then `.exe` → public repo only if/when portfolio-ready (private until then) |
| 14 | **Testing (Q7)** | Primary: phone browser + laptop, same WiFi; fallback: second laptop or VM |
| 15 | **Account delete (Q8)** | Author unsure → **default: yes, remove personal data**; anonymize messages (§8.1) |
| 9 | **Time available** | **Plenty of free time** after internship |
| 10 | **USB meaning** | **Installer distribution only**, not a runtime dependency or shared database on the stick |

---

## 8. Functional requirements — MVP

### 8.1 Authentication and users — **email + password (DECIDED Q4)**

**Sign up**

- [ ] Fields: **email** (unique), **password**, **password confirm**.
- [ ] Validate email format; password minimum length (suggest 8+).
- [ ] On success: create account, issue session/JWT, redirect to **profile onboarding** (§8.1b) — do not drop user straight into chat with empty profile.

**Sign in**

- [ ] Fields: **email** + **password** (same as sign up).
- [ ] On success: if profile onboarding incomplete → onboarding; else → main app.

**Account**

- [ ] **Log out**.
- [ ] **Delete own account** (with confirmation) — policy in §8.1c (Q8).
- [ ] Document DB-operator user removal (SQL or admin script).

### 8.1c Account deletion (Q8 — author unsure; **default adopted**)

Author was not sure; **MVP default** (privacy-friendly, common pattern):

| Data | On delete account |
|------|-------------------|
| Login (email, password) | **Removed** — cannot sign in again |
| Profile (username, birth date, avatar file) | **Removed** / scrubbed |
| Avatar file on disk | **Deleted** |
| Messages user sent | **Kept** for the other participant but sender shown as **“Deleted account”** (no PII) |
| Tasks where user was recipient | **Deleted** or marked removed (no assignee PII) |
| User row | **Soft delete** (`deleted_at` set) or hard delete after anonymize — implementer picks one; prefer soft delete + scrub fields |

**Rationale:** The other person in a 1-1 chat still has context; GDPR-style “forget me” scrubs identifiable data without nuking the colleague’s entire thread.

If author later wants **full cascade delete** (wipe all messages), that is a v1.1 setting — document in README.

**User list**

- [ ] After registration (and after onboarding), user **appears on global user list** (no admin approval).

### 8.1b Profile onboarding (post-signup — author request)

Shown **once** after first successful sign up (skippable fields noted below). User can edit later from **Settings / Profile**.

| Field | Required? | Notes |
|-------|-----------|--------|
| **Username** | **Yes** (for MVP) | Unique, shown in user list (e.g. `@panos` or `panos`) |
| **Display name** | Optional | Friendly name; defaults to username if empty |
| **Birth date** | Optional | `DATE` only; no age verification logic in v1 |
| **Profile picture** | Optional | Image upload; avatar in user list and chat header |

**Rules**

- [ ] **Skip / Finish later** allowed only if **username** is set (minimum bar to identify users).
- [ ] Avatar: accept **JPEG, PNG, WebP**; max size **2 MB**; store on server (e.g. `uploads/avatars/{userId}.webp`) — not a “chat attachment”.
- [ ] Crop or resize server-side to thumbnail (e.g. 256×256) — recommended for MVP.
- [ ] User list shows **avatar + username** (and optional display name on hover or subtitle).

**Not in onboarding v1:** bio paragraph, phone number, cover photo, social links (post-MVP).

### 8.2 User list

- [ ] View all registered active users (simple list; search optional but nice).
- [ ] Select a user → open or create a **1-1 thread**.

### 8.3 Messaging (1-1)

- [ ] Send **text-only** messages.
- [ ] View conversation history for a thread.
- [ ] **Recommended:** unread indicator per thread (original lacked this; good differentiator).

### 8.4 Tasks (simple) — **recipient-only visibility (DECIDED Q2)**

**Rule:** For a message with an attached task, **both participants see the message text**. **Only the recipient** (the user who did *not* send that message) can see the task body, act on it, and see it in their task list.

| Viewer | Message text | Task content | Clear / Delete task |
|--------|--------------|--------------|---------------------|
| **Sender** (who sent message + task) | Yes | **No** (optional UI hint only: “Task sent”) | No |
| **Recipient** (e.g. Giorgos) | Yes | **Yes** (subpanel + “My tasks”) | Yes |

Examples:

- You send Giorgos: `"hi"` + task `"check this email…"` → you see `"hi"` only; Giorgos sees `"hi"` + task in thread subpanel and in **My tasks**.
- Someone sends you a message + task → you see both; they see only the message.

Requirements:

- [ ] When sending, optionally attach **exactly one** task (text body).
- [ ] **Recipient** opens thread → message + **task subpanel** with Clear / Delete.
- [ ] **Sender** in same thread → sees message; **must not** receive task body from API (enforce server-side).
- [ ] **My tasks** view for each user: list of all tasks where they are the **recipient**, filterable by `open` / `cleared` / `deleted`.
- [ ] Status values: `open` | `cleared` | `deleted` — no due dates, no reassignment in v1.

### 8.5 Security (MVP targets — **Q3 decided: pragmatic baseline**)

- [ ] Passwords stored hashed (**bcrypt** or **Argon2**).
- [ ] **Encryption in transit:** HTTPS (TLS) in production; HTTP acceptable only on trusted local WiFi during dev.
- [ ] **Authorization:** API must never return task bodies to the sender (only to `assignee_id`) — security is not UI-only.
- [ ] **Deferred to v1.1+:** encrypting `messages.body` in the database at rest; **full end-to-end encryption** (v2).
- [ ] Basic rate limiting on register/login (nice to have).

Author was unsure on Q3; **agent default for MVP** is TLS + strong passwords + strict recipient-only task ACLs — not E2E in v1.

### 8.6 Explicit MVP exclusions

Group chats, departments, **file attachments in chat messages**, notifications, Active Directory login, mobile native apps, public multi-tenant SaaS without author approval.

**Allowed:** profile avatar image upload only (not sent as chat messages).

### 8.7 MVP one-liner (PanChat)

> **PanChat v1:** Users sign up with email/password, complete a short profile (username, optional birth date and avatar), appear on a global user list, and exchange 1-1 text messages with optional recipient-only tasks and a “My tasks” inbox; backed by PostgreSQL + API; clients use WiFi LAN (browser first, Electron `.exe` later).

---

## 9. Functional requirements — post-MVP

- Group channels / team rooms
- Departments or user tags
- Richer task workflow (in progress, due dates, reassignment)
- File attachments (with security story)
- Windows desktop notifications
- Audit logs and admin web dashboard
- End-to-end encryption
- MSI installer + auto-update
- One-command Docker LAN deploy package
- i18n polish (Greek primary UI already assumed)
- Rich profile (bio, phone, privacy settings for birth date visibility)
- Edit profile without full onboarding flow

---

## 10. Deployment and the USB install problem

### 10.1 What the USB actually did (clarified)

USB = **distribution of an installer**, not:

- A shared database on the stick
- A runtime requirement while the app is in use

After install, each PC runs a **client** that must communicate with **something central** (or peers) for multi-user chat to work.

### 10.2 Author’s concern

> “I want every computer to be able to install it and have it work — I haven’t built something like this before.”

This is the **#1 technical learning goal** alongside full-stack implementation.

### 10.3 WiFi vs ethernet (author concern — **no problem**)

The author does **not** have ethernet at home and uses **WiFi only**. That is fine.

| Term | Meaning for this project |
|------|--------------------------|
| **WiFi** | PCs and phones connect to the same **router** wirelessly |
| **LAN** | Local network — devices get addresses like `192.168.1.5` |
| **Ethernet** | Wired connection to the same router — **same LAN** as WiFi |

For this app, **WiFi LAN = ethernet LAN** for development and office use. You do **not** need ethernet cables. You need:

1. All PCs on the **same WiFi network** (same router).
2. One PC running the **server** (Docker: API + database).
3. Other PCs opening the app pointing at that server’s IP, e.g. `http://192.168.1.10:5173`.

**At home alone (one PC):** Run server + open browser on the same machine (`localhost`) to build and demo. Test “two users” with two browser profiles or incognito + normal window.

**Two PCs at home on same WiFi:** PC1 runs Docker; PC2 opens `http://<PC1-LAN-IP>:PORT`.

### 10.4 Browser vs `.exe` app (author concern — **hybrid plan DECIDED Q5/Q6**)

The municipality USB likely installed a **Windows desktop app**, e.g.:

- `Setup.exe` or `install.exe` → copies files to `Program Files`
- Possibly `YourApp.exe` + config file with **server address**
- Maybe .NET (WPF/WinForms), Electron, or similar — author did not inspect the stick

| Approach | What the user experiences | When to build |
|----------|---------------------------|---------------|
| **A. Browser** (Chrome/Edge) | Open a URL or bookmark; looks like a website | **MVP — build this first** |
| **B. PWA** (“Install app” in browser) | Icon on desktop, still the web app | Optional during MVP |
| **C. Electron `.exe`** | Double-click icon like the USB app; window wraps same React UI | **v1.1** — author knows Electron from ReactBits |
| **D. Tauri `.exe`** | Smaller binary than Electron | Alternative to C |

**DECIDED plan:**

1. **Phase 1 (MVP):** React web app + API server on **WiFi LAN** (or `localhost` for solo dev).
2. **Phase 2 (portfolio polish):** Package **Electron** portable `.exe` that opens the configured server URL (or bundles installer script) — matches “USB installed an app” feeling without changing backend logic.

Do **not** block MVP on `.exe`. The hard part is **server + API + recipient-only tasks**; the `.exe` is a shell.

### 10.5 Recommended architecture (DECIDED Q5)

**Model A — Central server on WiFi LAN + clients (browser first, Electron later)**

```
[Windows PC #1]  ─┐
[Windows PC #2]  ─┼── same WiFi router ──► [Server PC: Docker → API + PostgreSQL]
[Windows PC #N]  ─┘                              ▲
                                                 │
                    Browser or Electron → http://192.168.x.x:PORT
```

- One machine on the network runs **Docker Compose**: API + Postgres.
- Clients use **browser** in v1; optional **Electron `.exe`** in v1.1.
- “USB-style install” later = ship **`PanChat-Setup.exe`** (Electron-builder) + README: “enter server IP once”.

### 10.5.1 Host PC can also be a client (DECIDED Q12)

**Yes.** The laptop running Docker does **not** need a second device for “client 1.”

| Role on same machine | How |
|----------------------|-----|
| **Host** | `docker compose up` → Postgres (+ API when containerized or `pnpm dev` in `apps/api`) |
| **Client 1 (same PC)** | Browser → `http://localhost:5173` (Vite) talking to `http://localhost:4000` (API) |
| **Client 2 (phone / other PC)** | Browser → `http://<host-LAN-IP>:5173` on same WiFi |

```text
┌─────────────────────────────────────────────┐
│  Panos laptop (HOST + Client 1)             │
│  Docker: PostgreSQL                         │
│  Terminal: pnpm dev → API + React           │
│  Chrome tab 1: localhost:5173  (you)        │
│  Chrome incognito: localhost:5173  (user 2) │
└─────────────────────────────────────────────┘
         ▲
         │ WiFi
         ▼
   Phone: http://192.168.x.x:5173  (Client 2)
```

**Rules:**

- **One host at a time** on the LAN — whoever runs Docker holds the database.
- **Any PC** can be that host (not locked to one person’s machine forever); others must use **that host’s IP** and data lives on that host unless migrated.
- **Not in MVP:** “whoever opens the app automatically becomes the server” (peer-to-peer) — too complex for v1.

**Why this fits the author:** React / Node / PostgreSQL; WiFi at home works; Electron experience from ReactBits for the installer phase.

### 10.6 Other models (not recommended for MVP)

| Model | Summary | Verdict |
|-------|---------|---------|
| B — Electron desktop + remote API | Familiar from ReactBits; harder updates | v2 installer option |
| C — Peer-to-peer, no server | Nightmare for auth and sync | Avoid |
| D — Cloud-only (Supabase/Firebase) | Fast but weak “LAN install” story | Demo / optional hosted preview only |

### 10.7 Repository and public demo (DECIDED Q7)

| Stage | Repo visibility | Hosting |
|-------|-----------------|---------|
| **While building** | **Private** GitHub (or local only) | `localhost` + home WiFi |
| **When portfolio-ready** | **Optional public** GitHub | Optional README + screenshots; public cloud demo **not required** |
| **After web MVP** | Same | Then build **PanChat `.exe`** (Phase 9) |

- **No requirement** to deploy Railway/Fly.io for MVP.
- Do **not** commit secrets; `.env` in `.gitignore`.

### 10.8 Multi-device testing plan (DECIDED Q7 — phone + laptop)

**Author’s primary test setup:**

1. Run PanChat server on **laptop** (Docker).
2. Connect **phone** and **laptop** to the **same WiFi**.
3. On laptop: `http://localhost:5173` (or LAN IP).
4. On phone: `http://<laptop-LAN-IP>:5173` in Chrome/Safari — acts as second user.

**Requirements for phone testing:**

- [ ] UI **responsive** (mobile layout acceptable for test; desktop-first OK for MVP if phone usable).
- [ ] API CORS and `WEB_ORIGIN` allow phone origin (LAN IP).
- [ ] Server binds `0.0.0.0` not only `127.0.0.1` so LAN devices can connect.
- [ ] Windows firewall: allow inbound port once (document in README).

**If phone on WiFi fails** (guest isolation, AP isolation):

- Fallback A: **Second laptop** on same network.
- Fallback B: **VM** second “machine” on same host.
- Fallback C: Two browsers on one PC (normal + incognito) — always works for logic testing.

**Note:** Mobile browser testing validates responsive UI + real network; it does **not** require a native iOS/Android app in v1.

### 10.9 Portfolio demo without a second physical PC

- Run **Docker Compose** on laptop; record **demo video** (laptop + phone clips ideal).
- Two accounts: register on laptop, register on phone (or incognito).

---

## 11. Security and privacy

| Topic | MVP requirement | Notes |
|-------|-----------------|-------|
| Password storage | Hashed + salted | Never plain text |
| Transport security | TLS preferred | LAN may use self-signed cert in dev |
| Message encryption | **TLS in transit** for MVP; DB-at-rest / E2E later (§19 Q3) | Author unsure — baseline chosen |
| Task ACL | Recipient-only via API | Core privacy rule (Q2) |
| Account deletion | User-initiated | **Anonymize messages + scrub PII** (Q8 default); see §8.1c |
| Admin user removal | Database-level procedure | Document for operators |
| GDPR / legal | Low priority for generic portfolio | Required if ever deployed in Greek public sector |
| Spam / abuse | Rate limit register and login | Nice to have |

---

## 12. Draft data model

### 12.1 Entity relationship (conceptual)

```text
users ─────┬────< threads (participant A + B)
           │
messages ──┤──< optional 1:1 task
           │
thread_read_state (optional, per user)
```

### 12.2 Table draft

```text
users
  id                  UUID PRIMARY KEY
  email               VARCHAR UNIQUE NOT NULL
  password_hash       VARCHAR NOT NULL
  username            VARCHAR UNIQUE NOT NULL   -- set during onboarding
  display_name        VARCHAR NULL
  birth_date          DATE NULL
  avatar_url          VARCHAR NULL              -- path or URL to stored image
  profile_completed_at TIMESTAMPTZ NULL         -- null until onboarding done
  created_at          TIMESTAMPTZ NOT NULL
  deleted_at          TIMESTAMPTZ NULL            -- soft delete optional

threads
  id              UUID PRIMARY KEY
  user_low_id     UUID NOT NULL FK users  -- canonical pair: low UUID < high UUID
  user_high_id    UUID NOT NULL FK users
  created_at      TIMESTAMPTZ NOT NULL
  UNIQUE (user_low_id, user_high_id)

messages
  id              UUID PRIMARY KEY
  thread_id       UUID NOT NULL FK threads
  sender_id       UUID NOT NULL FK users
  body            TEXT NOT NULL            -- or body_ciphertext if app-layer encryption
  created_at      TIMESTAMPTZ NOT NULL

tasks
  id              UUID PRIMARY KEY
  message_id      UUID NOT NULL UNIQUE FK messages   -- enforces 1 task per message
  assignee_id     UUID NOT NULL FK users             -- recipient ONLY (Q2)
  created_by_id   UUID NOT NULL FK users             -- sender (for audit; cannot read task via API)
  body            TEXT NOT NULL
  status          ENUM ('open', 'cleared', 'deleted')
  created_at      TIMESTAMPTZ NOT NULL
  updated_at      TIMESTAMPTZ NOT NULL

thread_read_state                    -- recommended
  user_id         UUID FK users
  thread_id       UUID FK threads
  last_read_at    TIMESTAMPTZ
  PRIMARY KEY (user_id, thread_id)
```

### 12.3 Modeling notes for implementers

- **1-1 thread uniqueness:** Store `(min(userA, userB), max(userA, userB))` to prevent duplicate threads.
- **One task per message:** Enforce with `UNIQUE(message_id)` on `tasks`.
- **Recipient-only (Q2):** On message create with `task`, set `assignee_id` = the other participant (not `sender_id`). Index `tasks(assignee_id, status)` for “My tasks” inbox.
- **API rule:** `GET /threads/:id/messages` includes `task` object **only if** `currentUser.id === task.assignee_id`. Sender sees `hasTask: true` flag optional, never `task.body`.
- **WebSocket:** Emit full task payload only to assignee’s socket room.

---

## 13. Draft API surface

Base path: `/api/v1` (suggested). Auth: **JWT** in httpOnly cookie or `Authorization: Bearer` (pick one and stay consistent).

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Body: `{ email, password }` → session + `profileCompleted: false` |
| POST | `/auth/login` | Body: `{ email, password }` |
| POST | `/auth/logout` | Invalidate session |
| DELETE | `/auth/me` | Delete own account |
| GET | `/auth/me` | Current user + profile fields |
| PATCH | `/auth/me/profile` | Body: `{ username, displayName?, birthDate?, ... }` — onboarding completion |
| POST | `/auth/me/avatar` | `multipart/form-data` image → `avatar_url` |
| GET | `/users` | List active users: `id, username, displayName, avatarUrl` (no email to others) |
| POST | `/threads` | Body: `{ peerUserId }` → create or return existing 1-1 thread |
| GET | `/threads` | List current user’s threads (with last message preview) |
| GET | `/threads/:id/messages` | Paginated message history |
| POST | `/threads/:id/messages` | Body: `{ body: string, task?: { body: string } }` — server sets `assignee_id` to peer |
| GET | `/tasks/inbox` | List tasks where `assignee_id = me` (My tasks) |
| PATCH | `/tasks/:id` | Body: `{ status: 'cleared' \| 'deleted' }` — **403 unless** `assignee_id = me` |
| PATCH | `/threads/:id/read` | Mark thread read (update `thread_read_state`) |

### 13.1 WebSocket events (suggested)

| Event | Payload | When |
|-------|---------|------|
| `message:new` | message + threadId; task body **only to assignee** | New message in a thread |
| `task:updated` | task | Status changed — deliver to **assignee only** |
| `user:registered` | user summary | Optional; refresh user list |

---

## 14. Recommended tech stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Monorepo | **pnpm workspaces** (`apps/web`, `apps/api`) | One repo; shared scripts (decided Q11) |
| Frontend | **React 19 + TypeScript + Vite** | Author’s strongest area |
| Styling | **CSS Modules** | Author preference — full control per component |
| Backend | **Node.js + Fastify** | Small, explicit API; best for learning (Q9) |
| ORM | **Prisma** | Author has touched it in NoteForge |
| Database | **PostgreSQL 16** | Relational fit; Docker-friendly |
| Realtime | **Socket.io** | Rooms for recipient-only task events |
| Auth | **JWT** + **httpOnly cookie** | Browser-first; XSS-resistant vs localStorage token |
| Password hashing | **bcrypt** | Standard practice |
| Encryption | **TLS** + optional app-layer field encryption later | E2E is v2 |
| Local dev / demo | **Docker Compose** (Postgres first; API in container optional later) | Author learning Docker (Q3); Docker Desktop installed |
| Windows LAN helper | WiFi IP in `.env`; `install.bat` opens browser | MVP phase 8 |
| Desktop `.exe` | **Electron-builder** (author has ReactBits experience) | **v1.1** after web MVP ships |

**Alternative path (not default):** ASP.NET Core + SignalR + SQL Server — relevant for Greek public-sector jobs but slower given author’s current repos.

### 14.1 Development tools (DECIDED Q14 — 2026-05-19)

Tools **around** the app — not part of the runtime stack, but part of how Panos builds and learns.

| Tool | Use in PanChat? | When | Notes |
|------|-----------------|------|-------|
| **Git** | **Yes — required** | From **first day** of Phase 0 (once `apps/` exists) | Saves history; undo mistakes; required skill for any job. |
| **GitHub** | **Yes — private repo** | After **first local commit** or end of Phase 0 | Remote backup + portfolio later (Q7). Name: `panchat`. **Never push `.env`.** |
| **Postman** | **Yes — chosen** | Phase 1+ (auth & REST routes) | Test `POST /auth/register` before the React form exists. **Installed** on author machine; small prior try — will deepen in Phase 1. |
| **Browser DevTools** (Chrome/Edge) | **Yes — required** | Always | **Network** tab: see API calls, cookies, errors. **Application** tab: cookies for JWT. |
| **Docker Desktop** | **Yes** | Phase 0 | Already installed — runs PostgreSQL container. |
| **Cursor / VS Code** | **Yes** | Always | Editor + terminal; optional extensions below. |
| **pnpm** | **Yes** | Phase 0 | Monorepo installs and scripts (Q11). |
| **Prisma Studio** | **Yes — strongly recommended** | After first `prisma migrate` | Visual DB browser — see users/rows without SQL. Run: `pnpm exec prisma studio` in `apps/api`. |
| **ESLint + Prettier** | **Yes — light setup** | Phase 1 (not day 1) | Catch typos; consistent formatting. Vite/React templates often include ESLint. |
| **curl** (PowerShell `curl` / `Invoke-WebRequest`) | **Nice to learn** | Phase 1 | Quick one-line API tests without opening Postman. |
| **DBeaver / pgAdmin** | **Skip for MVP** | — | Prisma Studio is enough; add later if you want raw SQL practice. |
| **GitHub Desktop** | **Optional** | — | OK for visual git if CLI feels hard; still learn basic `git status` / `commit` / `push` commands. |
| **Socket.io testing** | **Not Postman** | Phase 5 | Postman is weak for WebSockets here — test via **two browser tabs** or a tiny HTML test page. |

**Git workflow (minimum to learn):**

```text
git status          → what changed?
git add .           → stage (never stage .env)
git commit -m "..." → save snapshot locally
git push            → send to GitHub
```

**`.gitignore` must include:** `node_modules/`, `.env`, `dist/`, Prisma local files you should not share.

**HTTP client (Q14b):** **Postman** — author has it installed; brief prior exposure. Use for REST in Phase 1+; WebSockets still tested in browser (Phase 5).

---

## 15. Architecture options and recommendation

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **A. WiFi LAN server + browser clients** | Works without ethernet; best for learning | One always-on host on the network | **✅ MVP (DECIDED)** |
| **B. Electron `.exe` + same API** | Matches USB/`.exe` expectation | Heavier; after web works | **✅ v1.1 (DECIDED)** |
| **C. SQLite per client only** | No server | Cannot do real multi-user chat | **❌ Reject** |
| **D. Cloud BaaS only** | Fastest MVP | Weak “install on LAN” narrative | Demo / hosted preview only |

**Decision status:** Model A for MVP + Model B (Electron) for installable `.exe` — **confirmed 2026-05-19**.

---

## 16. UI and UX direction

### 16.1 Layout (desktop-first) — **recipient-aware**

**Main chat view (3 columns when recipient has a task in focus):**

```text
┌─────────────┬──────────────────────────┬─────────────────┐
│  Users      │  Messages (1-1)          │  Task panel     │
│  [search]   │  bubbles + timestamps    │  (recipient     │
│  • Giorgos  │                          │   only)         │
│  • Maria    │  [ type message... ]     │  [Clear][Del]   │
│             │  [ ] Attach a task       │                 │
└─────────────┴──────────────────────────┴─────────────────┘
```

- **Sender** viewing the same thread: **hide** task subpanel (or show disabled hint: “Task sent to Giorgos”).
- **Recipient** viewing thread: show task subpanel for messages where they are `assignee_id`.

**My tasks (fourth area or tab — required by Q2):**

```text
┌──────────────────────────────────────┐
│  My tasks                            │
│  • [Giorgos chat] Check email…  open │
│  • [Maria chat] Call client… cleared │
└──────────────────────────────────────┘
```

Giorgos sees **all tasks assigned to him** in one place, not only when opening each chat.

### 16.2 UX principles

- **Simple > impressive** — non-technical users are a design reference, not power users.
- **Greek UI labels** primary (author’s context); English in code and docs.
- Large click targets, obvious primary actions.
- Empty states: “Select a user to start”, “No task on this message”.
- Do not turn this into Slack; resist feature creep during implementation.

### 16.3 Author’s UI goal

Better than the reference app’s “mediocre” frontend — achieved through **clarity and layout**, not heavy 3D or animation (author’s ReactBits skills are optional here).

---

## 17. Milestone plan

| Phase | Deliverable | Estimate |
|-------|-------------|----------|
| **0** | Monorepo + Docker Postgres + Prisma + health routes (**author implements** — §21.2) | **done** |
| **1** | Monorepo; Docker Compose; Postgres; Prisma; **email register/login** | 3–5 days |
| **1b** | **Profile onboarding** UI + API (username, birth date, avatar upload) | 2–4 days |
| **2** | User list (avatar + username); create/get 1-1 thread | 2–3 days |
| **3** | Messages REST; history pagination | 3–4 days |
| **4** | Task attach on send; task subpanel; clear/delete | 2–3 days |
| **5** | WebSocket realtime + unread state | 2–4 days |
| **6** | TLS + message encryption (per §19 Q3 decision) | 3–5 days |
| **7** | README, architecture diagram, screenshots, demo video | 2 days |
| **8** | WiFi LAN doc; firewall note; **test phone + laptop** on same WiFi | 2–3 days |
| **9** | **Electron `PanChat-Setup.exe`** — only after web MVP is stable | 3–5 days |
| **10** | Optional: make GitHub **public** + portfolio README/video | 1 day |

**Rough total:** 3–5 weeks part-time; faster if full-time after internship.

### 17.1 Definition of done (portfolio)

- [ ] Public GitHub repo with clean README
- [ ] `docker compose up` runs full stack locally
- [ ] Demo video showing two users, message + task, clear/delete
- [ ] No `node_modules` or secrets committed
- [ ] Brief “how I would deploy on office LAN” section in README

---

## 18. Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep (building Slack) | Never ships | Lock §8.6; park ideas in §9 |
| Deployment confusion | Author stuck | Start Model A on localhost; document LAN IP steps |
| “Encrypted messages” undefined | Over-engineering or insecurity | Decide Q3 before phase 6 |
| Task clear semantics ambiguous | Rework UI/API | Prototype with 2 test users in week 2 |
| Perfect UI blocks backend | No portfolio piece | Functional UI by end of phase 3 |
| Avatar upload scope | Delays chat MVP | Phase 1b; simple disk storage; max 2 MB |
| No server experience | Fear / blockers | Provide Docker Compose template; agent guides step-by-step |
| Phone cannot reach laptop | Testing blocked | Document firewall + `0.0.0.0`; fallback VM/incognito |
| WiFi AP isolation | Phone ↔ laptop fails | Use 2nd laptop or VM; note in README |

---

## 19. Open questions log

| ID | Question | Options | Decision | Date |
|----|----------|---------|----------|------|
| **Q1** | Product name | ThreadTask, DeskThread, PanChat, … | **PanChat** (author name: Panos) | 2026-05-19 |
| **Q2** | Who can see/act on a task? | Recipient-only vs shared | **Recipient-only.** Both see message; only assignee sees task body, subpanel, My tasks, Clear/Delete. | 2026-05-19 |
| **Q3** | Encryption scope for MVP | TLS / at-rest / E2E | **TLS + hashed passwords + API ACLs.** Author unsure; no E2E in v1. At-rest encryption v1.1+. | 2026-05-19 |
| **Q4** | Sign up / sign in | Email vs username for auth | **Email + password** for register and login. **Username** set in post-signup profile (unique, for display). | 2026-05-19 |
| **Q5** | Deployment / network | Ethernet vs WiFi; browser vs exe | **WiFi LAN OK.** Central server (Docker). **Browser first;** Electron `.exe` v1.1. No ethernet required. | 2026-05-19 |
| **Q6** | Electron installer in v1 or v2? | | **v1.1** (after web MVP) | 2026-05-19 |
| **Q7** | Release order, repo visibility, testing | Cloud vs private; phone test | **Web first → `.exe` when web done → public repo only if portfolio-ready (private until then).** No cloud deploy required. Test: **phone + laptop** same WiFi; fallback 2nd laptop/VM. | 2026-05-19 |
| **Q8** | Account deletion data | Wipe all vs anonymize | Author unsure (“maybe yes”). **Default: yes scrub personal data** — remove login/profile/avatar; messages show **“Deleted account”** for other user. | 2026-05-19 |
| **Q9** | Backend framework | Fastify vs NestJS | **Fastify** — smaller surface; learn HTTP layer by hand | 2026-05-19 |
| **Q10** | Styling | Tailwind vs CSS Modules | **CSS Modules** | 2026-05-19 |
| **Q11** | Package manager / monorepo | npm vs pnpm | **pnpm workspaces** | 2026-05-19 |
| **Q12** | Who runs the LAN server? | Fixed PC vs rotating vs auto-host | **One host at a time** (any PC can host). **Host may also use browser on same machine** (`localhost`). No auto-failover / no P2P host in MVP. | 2026-05-19 |
| **Q13** | Who writes the code? | Agent implements vs author implements | **Author implements everything.** Agent = teacher + **two `.md` files** (brief + learning journal). No agent scaffolding unless explicit exception. | 2026-05-19 |
| **Q15** | Learning journal + quizzes? | None vs companion md | **`panchat-learning-journal.md`** — skills map, session log, quiz every 5 steps | 2026-05-21 |
| **Q16** | Quiz vs progress in one message? | Mixed vs separate | **Separate only** — quiz-only turn, then build turn (or one step then quiz) | 2026-05-21 |
| **Q14** | Dev tools (git, GitHub, Postman, …) | See §14.1 | **Git + private GitHub + DevTools + Prisma Studio + Docker + Postman** (installed). No DBeaver for MVP. | 2026-05-19 |
| **Q14b** | HTTP API testing client | Postman vs Thunder Client vs curl only | **Postman** — already installed; light prior use | 2026-05-19 |

**Agent instruction:** **Q1–Q15 complete.** Also read/update **`panchat-learning-journal.md`**. **Do not** create or edit app code unless waived. **Do not run git** unless Panos asks — teach commands instead. **Current:** Phase 1–2 API on `main` (`132d466`). **Next:** React UI for chat, or tasks, or WebSocket. API binds `0.0.0.0` for LAN/phone tests (later). Electron (Phase 9) after web UI stable.

---

## 20. Conversation and decision history

### Session A — Portfolio review (`Programming` folder)

- Reviewed NoteForge, ReactBitsAntigravity, PianoTilesBot, Learn, Tests, TheLabTechBox.
- Conclusion: strong builder for age 21 with no job experience; uneven finish quality.
- Best job targets today: **Junior Frontend** or **Software Developer (junior)**.
- Full stack title premature until one end-to-end app ships.
- Flagship projects: ReactBits + PianoTilesBot.

### Session B — Municipality tool inspiration

- Internship ending; senior deployed chat+task tool via USB **installer**.
- Author wants generic learning/portfolio rebuild with auth, DB, encryption, better UI.
- Not targeting municipality production in v1.

### Session C — Discovery answers captured in §7

- 1-1 chat, one task per message, simple clear/delete, auto user list, no departments, text only, Windows clients, deployment model unknown.

### Session D — This document created

- Full English master brief for AI agents and author.
- Path: `Programming/docs/thread-task-chat-brief.md`

### Session E — Q2, Q3, Q5 decisions

- **Q2:** Tasks are **recipient-only**; “My tasks” inbox for assignee; sender sees message only.
- **Q3:** Author unsure → MVP = **TLS + bcrypt + server-side task ACL**; E2E deferred.
- **Q5:** **WiFi is fine** (no ethernet needed); **browser MVP first**, Electron `.exe` later to mimic USB installer.

### Session F — Q1 PanChat, Q4 email + profile onboarding

- **Q1:** Product named **PanChat**.
- **Q4:** Register/login with **email + password**; after signup → profile onboarding (username required; optional birth date, avatar).

### Session G — Q7 release/testing, Q8 deletion

- **Q7:** Web first; private repo while building; `.exe` after; public GitHub only when ready; test with **phone + laptop** on WiFi.
- **Q8:** Unsure → adopted **anonymize + scrub PII** default on account delete.

### Session H — Stack lock + host model

- **Q9:** **Fastify** (author defers; learning-first).
- **Q10:** **CSS Modules** (author preference).
- **Q11:** **pnpm** monorepo.
- **Q12:** One LAN **host at a time**; **host PC can also be client** via `localhost`; rotating host = manual IP + data on that machine.
- **Docker Desktop** installed on author machine.

### Session I — Teaching mode (author builds, agent documents)

- **Q13:** Author implements **all** code; agent edits brief + teaches in chat.
- Repo scaffold in progress (author-led).

### Session K — Learning journal + quizzes (Q15)

- Added **`panchat-learning-journal.md`**: Panos profile, skills map (✅/🟡/🔴), session log, quiz every 5 steps.
- **Quiz 1** due after step **0.4** (covers 0.0–0.4).
- Phase 0 progress: 0.0–0.3 complete.

### Session L — Quiz rhythm (Q16)

- **No** quiz + new step in the same agent message.
- **Quiz 2** (0.5–0.9) pending — Panos does **0.10+** first, then says **“let’s do Quiz 2”**.

### Session J — Development tools (Q14)

- **Git:** use from Phase 0; commit often with clear messages.
- **GitHub:** private repo `panchat` after first meaningful local commit.
- **Postman:** chosen for REST in Phase 1 — already installed; not needed for Phase 0.
- **Prisma Studio:** primary way to inspect DB during learning.
- **Browser DevTools:** primary way to debug frontend + cookies after login exists.

---

## 21. Next actions

### 21.1 For the author (high level)

1. ~~Decisions Q1–Q13~~ — done.
2. Work through **§21.2 Phase 0 checklist** (you type every command and file).
3. **Git:** `git init` early in Phase 0; first commit when folder structure exists (§21.2 step 0.13).
4. **GitHub:** create **private** repo `panchat` on GitHub; `git remote add` + `git push` after first local commit (or end of Phase 0).
5. **Postman:** reuse existing install when starting Phase 1 (auth API testing).
6. Then **Phase 1** (email auth) → **Phase 1b** (profile) per §17.
7. When chat works: test **phone + laptop** on same WiFi (§10.8).
8. When web is solid: **Phase 9** Electron `.exe`.
9. When happy with quality: **Phase 10** optional public repo + portfolio README/video.

### 21.2 Author progress — Phase 0 (monorepo + Docker Postgres)

Check off in chat; ask agent to mark `[x]` here when you complete each step.

| Step | Task | Done |
|------|------|------|
| 0.0 | Create root `.gitignore` (`node_modules`, `.env`, `dist`, etc.) — see §14.1 | [x] |
| 0.1 | Install **pnpm**: `npm install -g pnpm` — verify with `pnpm --version` | [x] |
| 0.2 | Create folders: `apps/web`, `apps/api`, optional `docs/` | [x] |
| 0.3 | Root `package.json` + `pnpm-workspace.yaml` (workspaces: `apps/*`) | [x] |
| 0.4 | **Web:** `pnpm create vite apps/web --template react-ts` — confirm dev server runs | [x] |
| 0.5 | **Web:** add one **CSS Module** (e.g. `App.module.css`) to prove styling approach | [x] |
| 0.6 | **Docker:** `docker-compose.yml` with **PostgreSQL 16** only; `docker compose up -d` | [x] |
| 0.7 | Copy `.env.example` → `.env` with `DATABASE_URL=postgresql://panchat:panchat@localhost:5432/panchat` | [x] |
| 0.8 | **API:** `apps/api` package — Fastify + TypeScript + `tsx` dev script | [x] |
| 0.9 | **API:** `GET /health` returns `{ ok: true }` | [x] |
| 0.10 | **Prisma** in `apps/api` — `User` model (email, password_hash, profile fields per §12) | [x] |
| 0.11 | `prisma migrate dev` — tables exist; `GET /health/db` checks DB connection | [x] |
| 0.12 | Root README: how to run db + api + web (three terminals or scripts) | [x] |
| 0.13 | `git init` → first commit → optional: private **GitHub** repo + `git push` (§14.1) | [x] |

**Phase 0 done when:** Postgres in Docker, API health + DB health work, Vite app runs — all **written by you**.

### 21.2b Author progress — Phase 1 (auth API) — DONE 2026-05-24

| Step | Task | Done |
|------|------|------|
| 1.1–1.2 | bcrypt, JWT, cookie plugins | [x] |
| 1.3–1.7 | register, login, me, logout | [x] |
| 1b | profile PATCH, `requireUser`, GET users | [x] |
| — | Quiz 4 (auth + status codes) | [x] |
| — | Git commit `132d466` (includes Phase 2) | [x] |

### 21.2c Author progress — Phase 2 (1-1 chat API) — DONE 2026-05-24

| Step | Task | Done |
|------|------|------|
| 2.1 | Prisma `Thread` + `Message` + migration | [x] |
| 2.2 | `POST /api/v1/threads` | [x] |
| 2.3 | `POST /api/v1/threads/:id/messages` | [x] |
| 2.4 | `GET /api/v1/threads/:id/messages` | [x] |
| 2.5 | `GET /api/v1/threads` (inbox + last message) | [x] |

**Phase 2 API done when:** two users can open a thread and exchange messages via Postman — **yes** (panos ↔ mitsos tested).

**Not done yet:** tasks on messages, WebSocket realtime, avatar upload, UI polish/responsive pass.

**React chat UI (2026-05-24):** login, session `/me`, user list, open thread, read/send messages, logout — **working** in `apps/web` (functional layout only).

### 21.2d Roadmap — author order (2026-05-24, aligns §17)

| Wave | Focus | Git commit after? |
|------|--------|-------------------|
| **A** | Checkpoint: Phase 3 web (`apps/web`, `api.ts`) | ✅ `f6a335b` |
| **B** | UI polish + responsive (phone + desktop) | **Yes — Panos runs** |
| **C** | Register + profile onboarding **UI** | optional mid-wave |
| **D** | Avatar API + UI | |
| **E** | Tasks (API + recipient-only + My tasks UI) | |
| **F** | WebSocket realtime + optional unread | |
| **G** | Harden: README, LAN test, demo script, refactor routes | **Yes — “MVP portfolio”** |
| **H** | Later: Electron, public repo, encryption phase 6 | v1.1+ |

**Still required for §8 MVP:** register/sign-up UI, onboarding UI, avatar, tasks, realtime (WS). **Done:** email login API, profile API, 1-1 chat API+web, logout.

### 21.3 For the guiding AI agent

1. **Never** create or edit application code unless author explicitly waives §0 in that message.
2. Teach **one step at a time** from §21.2; explain *why* before *how*.
3. On request, update §19, §20, §21.2, and lesson notes in this file only.
4. Never add §9 features to MVP without explicit author request.
5. When author pastes errors, debug in chat — do not “fix by editing their repo.”
6. **Git:** give Panos the commands; he runs them — do not commit/push unless he asks (2026-05-24).
7. **Prisma relations:** always show **both sides** of a relation (e.g. `User` back-relations + new model).
8. **After refactors:** remind Panos to re-run the **same Postman tests** before adding features.
9. Follow **§21.2d roadmap order** unless author reprioritizes; **git commands for Panos only** unless he asks agent to run them.

---

## 22. Appendices

### Appendix A — Comparison to original tool

| Feature | Original (reported) | This project MVP |
|---------|-------------------|------------------|
| Install via USB | Yes (installer) | Optional `install.bat` / doc; not runtime USB |
| User list on register | Yes | Yes |
| 1-1 chat | Yes | Yes |
| Task on message | Yes | Yes (max 1 per message) |
| Task subpanel | Yes (recipient) | Yes — **recipient only**; sender sees message only |
| My tasks inbox | Unknown | Yes — all tasks assigned to me |
| Text only | Yes | Yes |
| Notifications | No | No (v1) |
| Attachments | No | No |
| Auth / DB / encryption | Unknown / minimal | **Yes — primary differentiator** |
| Modern UI | Described as mediocre | **Goal: clear and simple** |

### Appendix B — Suggested README tagline

> **PanChat** — Lightweight LAN messaging with inline tasks and simple profiles. Built with React, Node, PostgreSQL, and WebSockets. A learnable full-stack portfolio project by Panos.

### Appendix C — Suggested repository structure

```text
panchat/
├── thread-task-chat-brief.md        # product spec (MVP, stack, API)
├── panchat-learning-journal.md    # author learning + quizzes
├── apps/
│   ├── web/                         # React + Vite
│   └── api/                         # Node + Fastify + Prisma
├── docker-compose.yml
├── .env.example
└── README.md
```

### Appendix E — Plain-language notes for the author (WiFi, exe, encryption)

**WiFi:** Your router gives every laptop a local address (`192.168.x.x`). Apps on the same WiFi can talk to each other without internet. Ethernet is just another way to plug into the same router — you do not need it.

**Why a server is still required:** USB only **installed** the program. Chat between Giorgos and Maria still needs a shared place for messages — usually one PC or a small server running 24/7 on the office network. At home you can run that on your own PC.

**Host = client on the same laptop:** When you run Docker on your laptop, you can open PanChat in Chrome on that same laptop (`localhost`) as user 1, and use incognito or your phone as user 2. You do not need two physical computers to start.

**Browser vs exe:** Building the **website first** is faster. The **`.exe`** later is the same app wrapped in a window (Electron) — like ReactBits. USB at the municipality was almost certainly an **installer (.exe)**, not “the app lives on the USB”.

**Encryption (Q3):** For MVP, “secure enough” means: passwords hashed, use HTTPS when possible, and **the server refuses to show tasks to the sender**. True “even the server cannot read messages” (E2E) is a later project.

**Phone testing (Q7):** Same WiFi as laptop → open `http://192.168.x.x:5173` on phone. If it fails, try VM or two browsers on PC — not a failure of the project.

**Private repo (Q7):** Normal to keep GitHub private while learning; flip to public when ready for employers.

### Appendix F — Development tools cheat sheet (Q14)

| I want to… | Tool |
|------------|------|
| Save my work / go back | **Git** (`commit`, `log`, `checkout`) |
| Backup online / portfolio | **GitHub** (private → public later) |
| Test login API without UI | **Postman** |
| See if React called the API | **Browser DevTools → Network** |
| See users in the database | **Prisma Studio** |
| Run PostgreSQL | **Docker Desktop** + `docker compose up` |
| Test realtime chat | **Two browser tabs** (not Postman) |

---

### Appendix D — Environment variables (preview)

```env
DATABASE_URL=postgresql://user:pass@db:5432/panchat
JWT_SECRET=change-me
API_HOST=0.0.0.0
API_PORT=4000
WEB_ORIGIN=http://localhost:5173
NODE_ENV=development
```

For phone testing on WiFi, also allow origin `http://192.168.x.x:5173` (or use a single `WEB_ORIGIN=*` in dev only).

```env
# Example dev-only (do not use in production)
# CORS_ORIGINS=http://localhost:5173,http://192.168.1.10:5173
```

---

*End of document. Update §19 and §20 when decisions are made.*
