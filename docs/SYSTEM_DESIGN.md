# DevNotes — Production System Design

> A production-grade, multi-tenant note-taking platform built for software developers.
> Markdown-first, code-aware, real-time collaborative, keyboard-driven, and searchable.

- **Status:** Production design v1
- **Last updated:** 2026-06-13
- **Frontend:** Next.js 16 (App Router, React 19) + shadcn/ui + Tailwind v4
- **Backend:** Next.js Route Handlers / tRPC + dedicated services (search, realtime, jobs)
- **Audience:** Engineering, product, SRE, security

---

## 1. Product Overview

### 1.1 Problem

Developers capture knowledge constantly — snippets, command incantations, debugging logs,
meeting notes, runbooks, TILs, architecture decisions. General-purpose tools treat code as a
second-class citizen: weak syntax highlighting, no language awareness, poor code search, and
no keyboard-first flow. Teams additionally need shared, versioned, access-controlled knowledge.

### 1.2 Solution

A markdown-first, code-aware knowledge platform that works for an individual developer and
scales to teams and organizations:

- First-class code blocks (VS Code-grade highlighting, language detection, copy, snippets).
- Fast hybrid search (full-text + code-token + semantic).
- Real-time collaborative editing with version history.
- Keyboard-driven UX (command palette, shortcuts).
- Organization via workspaces, notebooks, tags, and backlinks.
- Sharing, permissions, billing, and an API — production concerns from day one.

### 1.3 Goals & Non-Goals

**Goals**
- Sub-100ms perceived note open/switch; search results < 300ms p95.
- Never-lose-a-note durability: autosave, version history, soft delete, tested backups.
- Multi-tenant from the data model up; secure isolation between workspaces.
- Real-time collaboration without conflicts (CRDT).
- 99.9% availability with graceful degradation.

**Non-Goals**
- A full in-browser IDE or arbitrary code execution sandbox.
- Native mobile apps at launch (responsive PWA covers mobile; native is a later track).
- Replacing source control or issue trackers.

### 1.4 Personas

| Persona | Need |
|---|---|
| Solo developer | Quick capture, snippets, personal knowledge base, offline |
| Team lead | Shared runbooks, onboarding docs, ADRs, access control |
| Org admin | SSO, audit logs, billing, member management |
| Open-source maintainer | Public, linkable notes / TILs |

---

## 2. Scope (Production)

The product ships as a complete platform. Capabilities are grouped, not phased.

**Identity & Access**
- Email/password + OAuth (GitHub, Google) + SSO/SAML & SCIM for enterprise.
- Email verification, password reset, MFA (TOTP).
- Workspaces (personal + team) with roles: owner, admin, editor, commenter, viewer.
- Personal access tokens and OAuth apps for API access.

**Notes & Authoring**
- Create, edit, delete, restore (trash), purge.
- Markdown editor with live preview and rich-text affordances.
- Code blocks: Shiki highlighting, language detection/selector, copy, line numbers.
- Autosave (debounced, optimistic) with explicit save status and conflict handling.
- Real-time collaborative editing (CRDT) with presence cursors.
- Version history with diff view and restore.
- Templates (ADR, bug report, standup, retro, runbook).
- Daily notes / journal mode.

**Organization & Knowledge Graph**
- Workspaces → notebooks (nested) → notes.
- Tags (many-to-many), pin/favorite.
- Wiki-style backlinks `[[note]]` with bidirectional link panel.
- Snippets library (language, description, tags) with copy + CLI/VS Code sync.

**Search**
- Hybrid: full-text + code-token + semantic (embeddings) with typo tolerance.
- Filters (workspace, notebook, tag, author, date) and saved searches.
- Command palette (Cmd/Ctrl-K) for navigation and actions.

**Sharing & Collaboration**
- Public read-only share links (optional expiry, password).
- Comments, mentions, and notifications.
- Per-resource permissions inherited from workspace roles.

**Attachments & Media**
- Image/file uploads to object storage with CDN delivery and virus scanning.

**Platform**
- Billing & subscriptions (Stripe): free / pro / team / enterprise tiers with quotas.
- Public REST + tRPC API, webhooks, rate limits per plan.
- Import/export (Markdown, Obsidian vault, Notion, JSON).
- Offline mode (PWA, local-first sync).
- Admin console, audit logs, feature flags.
- AI assist: summarize, generate tags, explain code, semantic Q&A over a workspace.

---

## 3. Requirements

### 3.1 Functional

| ID | Requirement |
|---|---|
| F-01 | Users authenticate via email, OAuth, or enterprise SSO with optional MFA |
| F-02 | Users belong to one or more workspaces with role-based permissions |
| F-03 | Users create, edit, delete, restore, and version notes |
| F-04 | Editor renders markdown with live preview and highlighted, copyable code |
| F-05 | Notes autosave and support real-time multi-user editing |
| F-06 | Users organize notes via notebooks, tags, backlinks, and snippets |
| F-07 | Users perform hybrid search with filters and a command palette |
| F-08 | Users share notes publicly and collaborate via comments/mentions |
| F-09 | Users upload and embed attachments |
| F-10 | Admins manage members, billing, audit logs, and SSO |
| F-11 | Developers integrate via API, tokens, and webhooks |

### 3.2 Non-Functional / SLOs

| Attribute | Target |
|---|---|
| Performance | Note open < 100ms (cached); search p95 < 300ms; editor input latency < 16ms |
| Availability | 99.9% monthly for API/app; graceful read-only degradation |
| Durability | RPO ≤ 5 min, RTO ≤ 1 hr; no data loss via autosave + versions + backups |
| Scalability | 100k+ notes per workspace; 10k concurrent collaborators platform-wide |
| Security | OWASP Top 10, encryption at rest/in transit, tenant isolation, SOC 2-ready controls |
| Accessibility | WCAG 2.1 AA, full keyboard navigation |
| Privacy | User/workspace owns data; export anytime; GDPR/CCPA delete; data residency option |
| Observability | Tracing, metrics, structured logs; error budget tracked per SLO |

---

## 4. Architecture

### 4.1 High-Level

```
                              ┌───────────────┐
                              │      CDN       │  static assets, ISR,
                              │  (Vercel/CF)   │  share pages, images
                              └───────┬────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser (PWA)                                │
│  Next.js 16 App Router · React 19 · shadcn/ui · Tailwind v4           │
│  RSC (reads/lists) · Client (editor, palette) · Service Worker        │
│  TanStack Query (server cache) · Zustand (UI) · Yjs (CRDT doc)        │
└───────┬──────────────────────────┬────────────────────┬─────────────┘
        │ RSC / Server Actions      │ tRPC / REST         │ WebSocket
        ▼                           ▼                     ▼
┌──────────────────────────────────────────┐   ┌────────────────────────┐
│        Next.js App (stateless, N pods)    │   │   Realtime/Collab svc   │
│  Auth · Validation(Zod) · RateLimit       │   │  Yjs + y-websocket      │
│  Service layer · API · Webhooks           │   │  presence, awareness    │
└───┬─────────┬─────────┬─────────┬─────────┘   └───────────┬────────────┘
    ▼         ▼         ▼         ▼                          ▼
┌────────┐┌────────┐┌────────┐┌───────────┐        ┌──────────────────┐
│Postgres││ Redis  ││ Object ││  Search    │        │ Persistence       │
│primary ││cache,  ││Storage ││ Meili/     │        │ (snapshot CRDT    │
│+replicas││session,││S3/R2   ││ Typesense  │        │  → Postgres)      │
│ pgvector││queue,  ││+ CDN   ││ + pgvector │        └──────────────────┘
│         ││ratelmt ││        ││ hybrid     │
└────────┘└────────┘└────────┘└───────────┘
                          ▲
                          │ async (outbox → queue)
              ┌───────────┴─────────────┐
              │  Worker / Job service    │
              │  BullMQ: search index,   │
              │  AI embeddings, emails,  │
              │  exports, virus scan,    │
              │  webhooks, billing sync  │
              └──────────────────────────┘
```

**Design stance:** start as a modular monolith (Next.js app + a thin worker + a realtime
service), with clean service boundaries so search, realtime, and jobs can scale or be
extracted independently. The app tier is stateless and horizontally scalable; all state
lives in Postgres, Redis, object storage, and the search engine.

### 4.2 Components

| Component | Responsibility | Scaling |
|---|---|---|
| Next.js app | UI, RSC reads, API, auth, business logic | Horizontal, stateless behind LB |
| Realtime service | CRDT sync, presence, awareness | Sticky by document; horizontal w/ Redis pub/sub |
| Worker service | Async jobs (indexing, AI, email, export, webhooks) | Horizontal by queue concurrency |
| Postgres | Source of truth (primary + read replicas) | Vertical + read replicas; partition large tables |
| Redis | Cache, sessions, rate limits, queue, pub/sub | Cluster / managed |
| Search engine | Hybrid full-text + vector ranking | Replicated nodes |
| Object storage + CDN | Attachments, exports, public assets | Managed (S3/R2) |

### 4.3 Frontend layout (3-pane shell)

```
┌──────────┬───────────────┬──────────────────────────────┐
│ Sidebar  │ Note list     │ Editor / Preview              │
│ Workspace│ search box    │ # Title       ● collab cursors│
│ Notebooks│ note card     │ markdown ... live preview     │
│ Tags     │ note card     │ ```ts code block (copy) ```   │
│ Favorites│ note card     │                               │
│ Trash    │ note card     │ ✓ saved · v23 · 2 editing     │
└──────────┴───────────────┴──────────────────────────────┘
   collapsible   virtualized      Cmd-K palette overlays all
```

---

## 5. Data Model

Multi-tenant: every domain row is scoped by `workspace_id`. Authorization is enforced at the
service layer and (defense-in-depth) via Postgres Row-Level Security.

```
User
  id, email (unique), email_verified_at, password_hash (nullable)
  name, avatar_url, mfa_secret (nullable), created_at, updated_at

Account                       // OAuth/SSO provider links
  id, user_id, provider, provider_account_id, tokens..., expires_at

Session
  id, user_id, ip, user_agent, expires_at, created_at

Workspace
  id, name, slug (unique), plan ('free'|'pro'|'team'|'enterprise')
  owner_id, settings (jsonb), created_at, updated_at

WorkspaceMember
  id, workspace_id, user_id, role ('owner'|'admin'|'editor'|'commenter'|'viewer')
  invited_by, joined_at                       // pk(workspace_id, user_id)

Notebook
  id, workspace_id, name, parent_id (nullable), position, created_at, updated_at

Note
  id, workspace_id, notebook_id (nullable), author_id
  title, content_md (text), content_text (text)   // plaintext for FTS
  crdt_state (bytea, nullable)                     // Yjs snapshot
  is_pinned, deleted_at (nullable)
  current_version (int), created_at, updated_at
  // tsvector GIN index over (title, content_text)

NoteVersion
  id, note_id, version (int), author_id
  content_md, diff (jsonb), created_at

Tag             id, workspace_id, name, color        // unique(workspace_id, name)
NoteTag         note_id, tag_id                       // pk(note_id, tag_id)
NoteLink        source_note_id, target_note_id        // backlinks

Snippet
  id, workspace_id, author_id, title, language, code, description, created_at

Attachment
  id, workspace_id, note_id (nullable), uploader_id
  storage_key, mime, size, checksum, scan_status, created_at

Comment
  id, note_id, author_id, body, anchor (jsonb, nullable)
  resolved_at, created_at

ShareLink
  id, note_id, token (unique), scope ('read')
  password_hash (nullable), expires_at, created_at

Embedding                     // semantic search
  id, workspace_id, note_id, chunk_idx, vector (pgvector), content

ApiToken        id, user_id, workspace_id, name, hash, scopes[], last_used_at, expires_at
Webhook         id, workspace_id, url, events[], secret, active
Subscription    id, workspace_id, stripe_customer_id, stripe_sub_id, plan, status, period_end
AuditLog        id, workspace_id, actor_id, action, target, metadata (jsonb), created_at
Notification    id, user_id, type, payload (jsonb), read_at, created_at
```

**Indexing**
- `notes(workspace_id, notebook_id, updated_at desc)` — list views.
- `notes(workspace_id, deleted_at)` — trash filtering.
- GIN tsvector on notes; IVFFlat/HNSW index on `embedding.vector`.
- `note_tags(tag_id)`, `note_links(target_note_id)`, `audit_logs(workspace_id, created_at)`.
- Partition `audit_log` and `note_version` by time once large.

---

## 6. API Design

Primary internal API is **tRPC** (end-to-end types). A versioned **public REST API**
(`/api/v1/...`) serves integrations, tokens, and webhooks.

```
Auth
  POST   /api/v1/auth/register | login | logout
  POST   /api/v1/auth/password/reset | mfa/verify
  GET    /api/v1/auth/oauth/:provider/callback
  POST   /api/v1/auth/sso/:workspace            // SAML

Workspaces
  GET/POST/PATCH/DELETE  /api/v1/workspaces[/:id]
  GET/POST/PATCH/DELETE  /api/v1/workspaces/:id/members[/:userId]

Notes
  GET    /api/v1/notes?notebook=&tag=&q=&author=&sort=&cursor=
  POST   /api/v1/notes
  GET    /api/v1/notes/:id
  PATCH  /api/v1/notes/:id                      // title, content, notebook, pin
  DELETE /api/v1/notes/:id                       // soft delete
  POST   /api/v1/notes/:id/restore
  GET    /api/v1/notes/:id/versions[/:v]
  POST   /api/v1/notes/:id/versions/:v/restore
  GET/POST  /api/v1/notes/:id/comments

Notebooks | Tags | Snippets   GET/POST/PATCH/DELETE  .../[:id]
Attachments  POST /api/v1/attachments (presigned)  ·  GET /api/v1/attachments/:id
Share        POST/DELETE /api/v1/notes/:id/share
Search       GET  /api/v1/search?q=&type=fulltext|semantic|hybrid&filters=
Webhooks     GET/POST/DELETE /api/v1/webhooks[/:id]
Billing      GET /api/v1/billing  ·  POST /api/v1/billing/checkout | portal
```

**Conventions**
- Cursor pagination; Zod-validated I/O; consistent error envelope
  `{ error: { code, message, details, requestId } }`.
- Every query scoped by `workspace_id` derived from session/token + membership check.
- Idempotency keys on POST; ETag/`If-Match` on PATCH for optimistic concurrency.
- Per-plan rate limits surfaced via `RateLimit-*` headers.

---

## 7. Key Technical Decisions

| Area | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 App Router | RSC for fast reads, SSR/ISR for share pages, one codebase |
| UI | shadcn/ui + Tailwind v4 | Own accessible (Radix) primitives, fast theming |
| Editor | TipTap (ProseMirror) + CodeMirror 6 code blocks | Rich markdown WYSIWYG + best-in-class code editing; ProseMirror integrates with Yjs |
| Collaboration | Yjs + y-websocket | Battle-tested CRDT; offline-friendly; presence/awareness |
| Markdown render | remark/rehype + Shiki + rehype-sanitize | VS Code-grade highlighting, XSS-safe |
| DB | Prisma Postgres (+ pgvector) | Serverless Postgres; direct pooled `postgres://` connection via the `@prisma/adapter-pg` driver adapter; relational, strong FTS, vectors when pgvector is enabled |
| ORM | Prisma | Type-safe, rich tooling/migrations; RLS enforced via scoped connection + policies |
| Auth | Auth.js or Lucia + SAML/SCIM provider | OAuth, sessions, enterprise SSO |
| Search | Meilisearch/Typesense + pgvector hybrid | Typo tolerance, code tokens, semantic ranking |
| Client cache | TanStack Query | Optimistic updates, retries, cache |
| UI state | Zustand | Palette/panel/theme state |
| Jobs | BullMQ on Redis | Indexing, AI, email, export, webhooks |
| Billing | Stripe | Subscriptions, metered quotas, customer portal |
| Hosting | Vercel (app) + Prisma Postgres (PG) + managed Redis + R2/S3 | Low-ops, scalable |

### 7.1 Editing, autosave & conflict handling
- Live editing flows through the **Yjs CRDT document** over WebSocket → conflict-free merges.
- Local edits apply optimistically; the realtime service broadcasts updates and persists
  periodic **CRDT snapshots** to Postgres (`crdt_state`) plus a derived `content_md`.
- Solo/offline edits buffer in IndexedDB (y-indexeddb) and sync on reconnect.
- A version row is written on meaningful diffs (debounced) for history/restore.
- REST PATCH path (non-collab clients/API) uses ETag/`If-Match` optimistic concurrency.

### 7.2 Search pipeline
- Writes emit an **outbox** event → queue → worker upserts into Meilisearch and computes
  embeddings into `pgvector`.
- Query path runs lexical + vector retrieval and **fuses rankings (hybrid)**; falls back to
  Postgres FTS if the engine is unavailable (graceful degradation).

### 7.3 Caching
- RSC + `fetch` cache and React cache for reads; tag-based revalidation on mutation.
- Redis for session, hot note metadata, rate-limit counters, and pub/sub fan-out.
- CDN for static assets, public share pages (ISR), and attachment delivery.

---

## 8. Security, Privacy & Compliance

- **AuthN:** Argon2id password hashing; MFA (TOTP); SSO/SAML + SCIM for enterprise.
- **Sessions:** httpOnly, Secure, SameSite cookies; rotation on privilege change; device list.
- **AuthZ:** role-based checks in the service layer + **Postgres Row-Level Security** keyed on
  `workspace_id` as defense-in-depth. Tokens carry least-privilege scopes.
- **Tenant isolation:** every query filtered by workspace; cross-tenant access is structurally
  prevented and tested.
- **Input/Output safety:** Zod validation on every boundary; markdown sanitized with
  rehype-sanitize to prevent stored XSS; CSP, HSTS, secure headers.
- **Secrets:** managed secret store; no secrets in client bundles; signed webhooks.
- **Attachments:** presigned uploads, MIME/size limits, async virus scan before serving.
- **Rate limiting & abuse:** per-IP + per-user + per-plan limits on auth and write paths.
- **Encryption:** TLS in transit; encrypted volumes at rest; field-level encryption for tokens.
- **Privacy/compliance:** full export, hard delete, audit logs, data-residency option;
  GDPR/CCPA workflows; SOC 2-oriented controls and access reviews.

---

## 9. Observability & Operations

- **Tracing/metrics/logs:** OpenTelemetry traces, RED/USE metrics, structured logs with
  `requestId`/`workspaceId` correlation; dashboards per service.
- **Errors:** Sentry (client + server) with release tracking and source maps.
- **Product analytics:** privacy-friendly (PostHog/Plausible) — funnels, retention, feature use.
- **SLOs & alerting:** error budgets per SLO; paging on availability/latency/queue-lag burn.
- **Feature flags:** staged rollout, kill switches, per-workspace targeting.
- **Backups/DR:** continuous WAL archiving + daily snapshots; RPO ≤ 5 min, RTO ≤ 1 hr;
  quarterly restore drills; multi-AZ; documented runbooks.
- **CI/CD:** lint + typecheck + unit/integration/E2E on PR; preview deploys; gated, reversible
  DB migrations (expand/contract); blue-green or canary releases.

---

## 10. Performance & Scalability Strategy

- Stateless app tier behind a load balancer; scale pods on CPU/RPS.
- Read replicas for list/search-heavy reads; primary for writes; connection pooling (PgBouncer).
- Virtualized note lists; RSC streaming; route-level code splitting.
- Realtime sharded by document with Redis pub/sub; sticky routing per doc.
- Async everything non-critical via the queue (indexing, AI, email, exports, webhooks).
- Table partitioning (audit log, versions, embeddings) and archival of cold data.
- Quotas per plan (storage, AI calls, API rate) enforced centrally.

---

## 11. Risks & Open Questions

- **Editor + CRDT integration** (TipTap/ProseMirror + Yjs) is the highest-complexity area —
  prototype the collab + offline + persistence loop end-to-end before committing UI breadth.
- **CRDT persistence/compaction**: snapshot cadence and GC of update logs need tuning at scale.
- **Search cost/complexity**: hybrid ranking and embedding refresh add infra; validate
  relevance and cost before broad rollout.
- **AI features**: data governance (what leaves the tenant boundary), cost controls, and
  opt-in/out per workspace.
- **Self-host/enterprise** demand may push toward containerized deploys beyond Vercel.
- **Data residency**: regionalization affects DB, storage, and search topology — decide early.

---

## 12. Delivery Sequencing (engineering order, not scope cuts)

The full product is the target; this is a safe build order for a production launch.

| Track | Builds |
|---|---|
| Foundation | Schema + RLS, auth (email/OAuth/MFA), workspaces/roles, CI/CD, observability |
| Core notes | Editor (TipTap+CM6), autosave, notebooks, tags, trash, versions |
| Realtime | Yjs collab service, presence, persistence, offline sync |
| Findability | Hybrid search pipeline, command palette, backlinks, snippets |
| Collaboration | Sharing, comments/mentions, notifications, attachments |
| Platform | Billing/quotas, public API + webhooks, import/export, admin + audit |
| Intelligence | AI assist, semantic Q&A, enterprise SSO/SCIM, data residency |

### Definition of Production-Ready
- Core + collab flows covered by unit/integration/E2E (Playwright) tests.
- Load test meets SLOs (note open, search p95, concurrent collab).
- Security review passed (authz, tenant isolation, XSS, rate limits); pen-test for enterprise.
- Backups + restore drill executed; runbooks and on-call in place.
- Lighthouse a11y ≥ 95; keyboard-only usable; WCAG 2.1 AA audited.

---

## 13. Appendix — Repository Structure

```
app/
  (marketing)/                # landing, pricing, public share pages (ISR)
  (app)/
    [workspace]/
      notes/[id]/page.tsx     # RSC shell + client editor
      layout.tsx              # 3-pane shell
  api/v1/                     # public REST route handlers
components/
  ui/                         # shadcn primitives
  editor/                     # tiptap, code block (CM6), toolbar, collab cursors
  command-palette/
lib/
  db/                         # drizzle schema, migrations, RLS policies
  auth/  search/  realtime/  validation/  billing/  ai/
server/
  services/                   # notes, notebooks, tags, search, billing, sharing
  trpc/
  jobs/                       # bullmq processors
services/
  realtime/                   # y-websocket server
  worker/                     # standalone job runner
infra/                        # IaC, migrations gate, runbooks
```
