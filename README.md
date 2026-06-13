# DevNotes

A production-grade, multi-tenant note-taking platform built for software developers —
markdown-first, code-aware, keyboard-driven, and searchable.

> Full architecture and product scope: [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md)

## Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **UI:** shadcn/ui + Tailwind v4
- **Database:** Prisma Postgres (via Prisma 7, `prisma+postgres://`) + pgvector
- **Auth:** Auth.js v5 (GitHub/Google OAuth + email/password)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env and fill in the values:

```bash
cp .env.example .env
```

- **`DATABASE_URL`** — create a Prisma Postgres database in the
  [Prisma Console](https://console.prisma.io) (or run `npx prisma init --db`) and paste the
  direct pooled `postgres://...@pooled.db.prisma.io` connection string (used via the
  `@prisma/adapter-pg` driver adapter).
- **`AUTH_SECRET`** — generate with `npx auth secret`.
- **OAuth** — create GitHub/Google OAuth apps and set the client id/secret. Callback URLs:
  - `http://localhost:3000/api/auth/callback/github`
  - `http://localhost:3000/api/auth/callback/google`

### 3. Run database migrations

```bash
npm run db:migrate
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create & apply a dev migration |
| `npm run db:deploy` | Apply migrations (CI/production) |
| `npm run db:studio` | Open Prisma Studio |

## Project structure

```
app/
  (app)/           # authenticated 3-pane shell (sidebar · list · editor)
  sign-in/         # auth pages
  api/auth/        # Auth.js route handler
auth.ts            # Auth.js config (adapter + credentials)
auth.config.ts     # edge-safe config (used by proxy.ts)
proxy.ts           # route guard (Next 16's renamed middleware)
prisma/schema.prisma
lib/db.ts          # Prisma client singleton
```
