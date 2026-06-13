# DevNotes — Implementation Plan & Task Tracker

> Step-by-step build log. Check items off as you go. Each **TODO** block is sized to be
> picked up in a fresh session — it names the files to touch and the acceptance check.
> Architecture reference: [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md).

- **Last updated:** 2026-06-13
- **Legend:** `[x]` done · `[ ]` todo · 🔒 blocked on a secret/decision

---

## Current State (snapshot)

- Next.js 16 (App Router, React 19) + Tailwind v4 + shadcn/ui scaffolded.
- Prisma 7 + **Prisma Postgres** (direct pooled `postgres://` via `@prisma/adapter-pg`).
- Full multi-tenant schema migrated to the live DB (`init` migration applied).
- Auth.js v5 wired (GitHub/Google/credentials), not yet tested end-to-end (needs secrets).
- App runs on **mock data**; `typecheck`, `lint`, `build` all green.

**Verify gates anytime:** `npm run typecheck && npm run lint && npm run build`

---

## ✅ Done

### Track 0 — Foundation
- [x] Initialize shadcn/ui (neutral) + core components (sidebar, command, dialog, input,
      tooltip, scroll-area, avatar, sonner, tabs, skeleton, separator, label, card)
- [x] Theme provider + light/dark toggle (`next-themes`)
- [x] 3-pane app shell: `components/app-sidebar.tsx`, `components/app-shell.tsx`,
      `app/(app)/layout.tsx`, `app/(app)/notes/page.tsx`
- [x] Command palette (Cmd/Ctrl-K): `components/command-palette.tsx`
- [x] Root `/` → `/notes` redirect; metadata/title set
- [x] Prisma 7 + Prisma Postgres via `@prisma/adapter-pg` (`lib/db.ts`)
- [x] Full schema (`prisma/schema.prisma`) + **`init` migration applied to live DB**
- [x] `npm` scripts: `typecheck`, `db:generate`, `db:migrate`, `db:deploy`, `db:studio`
- [x] Fixed Next 16 / React 19 gotchas: `middleware.ts` → `proxy.ts`,
      `useSyncExternalStore` in `hooks/use-mobile.ts`

### Track 1 — Auth (wiring complete, runtime untested)
- [x] Auth.js v5 split config: `auth.config.ts` (edge) + `auth.ts` (adapter + credentials)
- [x] Argon2id credentials (`@node-rs/argon2`), GitHub + Google OAuth providers
- [x] Route handler `app/api/auth/[...nextauth]/route.ts`, guard `proxy.ts`
- [x] Sign-in page `app/sign-in/page.tsx`; session `user.id` types `types/next-auth.d.ts`
- [x] `.env.example` documents all secrets

---

## 🔜 TODO

### Track 1.5 — Make auth runnable 🔒 (needs secrets)
- [ ] 🔒 Add to `.env`: `AUTH_SECRET` (`npx auth secret`), `AUTH_GITHUB_ID/SECRET`,
      `AUTH_GOOGLE_ID/SECRET`
- [ ] Register OAuth apps; callback URLs:
      `http://localhost:3000/api/auth/callback/{github,google}`
- [ ] **Verify:** sign in with GitHub → redirected to `/notes`; row created in `User`/`Account`
- [ ] Sign-up flow for credentials (hash with Argon2id, create `User`): add
      `app/sign-up/page.tsx` + server action using `@node-rs/argon2` `hash()`
- [ ] Sign-out button in the sidebar footer (calls `signOut()`)

### Track 2 — Workspace bootstrap & context
- [ ] On first sign-in, create a personal `Workspace` + `WorkspaceMember(owner)`.
      Use Auth.js `events.createUser` in `auth.ts` (slug from email; `db.workspace.create`)
- [ ] `lib/workspace.ts`: `getActiveWorkspace(userId)` + membership/role helpers
- [ ] Resolve active workspace in the app layout; pass to sidebar (replace mock workspace)
- [ ] (Optional) workspace switcher UI in `app-sidebar.tsx`
- [ ] **Verify:** new user lands in `/notes` with exactly one owned workspace

### Track 3 — Notes CRUD (replace mock data)
- [ ] Set up tRPC: `server/trpc/` (context with session + `workspaceId`, protected procedure
      that asserts membership). Alternative: typed Route Handlers if you prefer REST.
- [ ] `server/services/notes.ts`: list / get / create / update / softDelete / restore —
      **every query filtered by `workspaceId`**
- [ ] Zod input schemas in `lib/validation/`
- [ ] Wire note **list pane** to live data (`app/(app)/notes/page.tsx`)
- [ ] Wire **notebooks + tags** in `app-sidebar.tsx` to live data
- [ ] Wire **command palette** recent/jump to live notes
- [ ] Trash view (`deletedAt`) with restore + permanent delete
- [ ] **Verify:** create a note in one workspace; confirm it is NOT visible to another user

### Track 4 — Editor (the high-risk spike — do early)
- [ ] Spike on a throwaway branch first: TipTap (ProseMirror) + CodeMirror 6 code blocks
- [ ] Markdown editing + live preview; Shiki highlighting; copy button per code block
- [ ] `rehype-sanitize` on rendered markdown (XSS) — see SYSTEM_DESIGN §8
- [ ] Autosave: debounce ~800ms → optimistic update → PATCH; ETag/`If-Match` concurrency
- [ ] Save status indicator ("✓ saved")
- [ ] **Verify:** edit a note, refresh, content persists; offline edit doesn't lose data

### Track 5 — Realtime collaboration
- [ ] Standalone `services/realtime/` y-websocket server
- [ ] Integrate Yjs with the editor; presence cursors
- [ ] Persist CRDT snapshots → `Note.crdtState`; derive `contentMd`/`contentText`
- [ ] Offline buffering via `y-indexeddb`; sync on reconnect
- [ ] Write `NoteVersion` rows on meaningful diffs; history + restore UI
- [ ] **Verify:** two browsers edit the same note simultaneously without conflict

### Track 6 — Search & knowledge graph
- [ ] Postgres FTS: add `tsvector` column + GIN index (raw SQL migration); search service
- [ ] Hook up search box + command palette to FTS
- [ ] Backlinks: parse `[[note]]`, maintain `NoteLink`, bidirectional panel
- [ ] Snippets library UI + CRUD
- [ ] (Later) external engine (Meilisearch/Typesense) + `pgvector` semantic — re-enable the
      `Embedding` model, pgvector extension, and `postgresqlExtensions` preview together
- [ ] **Verify:** search returns by title + body + code token

### Track 7 — Collaboration & sharing
- [ ] Public read-only share links (`ShareLink`, optional expiry/password) + public page (ISR)
- [ ] Comments + mentions (`Comment`) on notes
- [ ] Notifications (`Notification`) + bell UI
- [ ] Attachments: presigned upload to object storage, async virus scan, CDN delivery
- [ ] **Verify:** open a share link in a logged-out browser; comment notifies the author

### Track 8 — Platform hardening
- [ ] Rate limiting (Redis) on auth + write endpoints
- [ ] Postgres Row-Level Security policies keyed on `workspaceId` (defense-in-depth)
- [ ] Billing: Stripe tiers + quotas (`Subscription`); checkout + customer portal
- [ ] Public REST API (`/api/v1`) + `ApiToken` + `Webhook` delivery
- [ ] Import/export (Markdown, Obsidian, Notion, JSON)
- [ ] Admin console + `AuditLog` writes on sensitive actions
- [ ] Observability: Sentry, OpenTelemetry, structured logs, uptime + backup drill
- [ ] CI: lint + typecheck + Playwright E2E on PR; preview deploys

### Track 9 — Intelligence & enterprise
- [ ] AI assist: summarize, generate tags, explain code, semantic Q&A over a workspace
- [ ] Enterprise SSO/SAML + SCIM provisioning
- [ ] MFA (TOTP) enable/verify flow (schema already has `mfaSecret`)
- [ ] PWA / offline mode; data-residency options

---

## How to resume in a new session

1. Read this file + [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md).
2. Pick the topmost unchecked TODO block.
3. Run the verify gates before and after: `npm run typecheck && npm run lint && npm run build`.
4. Check off completed items here and bump **Last updated**.
