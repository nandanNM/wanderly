# CLAUDE.md

Guidance for working in this repository.

## Project

Next.js 16 (App Router) event-sharing platform. TypeScript, Tailwind v4, pnpm.

- **Auth:** Better Auth (email/password + Google OAuth, **admin plugin** for roles) — `lib/auth.ts`, client in `lib/auth-client.ts`, route at `app/api/auth/[...all]/route.ts`.
- **DB:** PostgreSQL (Neon) via Drizzle ORM (node-postgres). Schema in `db/`, migrations in `drizzle/`.
- **Storage:** S3 uploads via presigned URLs — `lib/s3.ts`, `app/api/presigned`, `app/api/uploads`.
- **Domain:** plans → users → events → event_members / media / media_access. Business rules (owner auto-add, storage sync, plan quotas, member caps) live in the `drizzle/*_event_rules` SQL migration; the schema ERD is `schema_erd.mermaid`.

## 🎨 UI — Sketchbook UI (default)

**Build all UI with [`sketchbook-ui`](https://sarthakrawat-1.github.io/sketchbook-ui/) by default.** Reach for a plain HTML element or a custom-styled component only when no Sketchbook component fits — and say so.

- **Import components from `sketchbook-ui`**, e.g. `import { Button, Card, Input, Badge } from "sketchbook-ui"`. Prefer these over hand-rolled buttons/inputs/cards/etc.
- **Client-only:** the library ships without `"use client"` directives but uses hooks, so its components render only inside a `"use client"` component/file. Server Components must delegate to a client child (see `app/page.tsx` → `components/landing/landing.tsx`).
- **Already wired:** the stylesheet is imported once in `app/layout.tsx` (`import "sketchbook-ui/style.css"`) and `SketchProvider` wraps the app via `app/providers.tsx`. Don't re-import the CSS or re-mount the provider.
- **Theme:** the look is the default Caveat/paper theme (`bg #faf7f0`, `stroke/text #2a2a2a`). Every component takes `colors` and `typography` props for overrides. Use the `.font-hand` class (Caveat) for hand-drawn headings.
- **Available components:** Button, Input, Textarea, Checkbox, Switch, Select, RadioGroup, Slider, Badge, Avatar, Card (`paper`/`notebook`/`sticky`), Divider (`scribble`/`dashed`/`dots`/`zigzag`), Progress, Skeleton, Spinner, Tooltip, Toast (`useToast`), Modal, Dropdown, Accordion.
- **The landing page** (`components/landing/landing.tsx`) is built entirely with sketchbook-ui and showcases the full component set; use it as a usage reference. Global CSS (`app/globals.css`) uses the paper theme (`bg #faf7f0`, `text #2a2a2a`).

## 📁 Components & reuse

Shared components live under `components/` (never `app/_components`). When you build something used in more than one place, extract it here rather than duplicating.

- `components/ui/` — small reusable primitives: `logo.tsx` (`<Logo>` wordmark), `google-icon.tsx`, `client-only.tsx` (hydration guard for non-deterministic sketch SVGs), `card-fan-carousel.tsx`.
- `components/` — larger reusable widgets: `globe-polaroids.tsx` (cobe globe).
- `components/landing/` — the marketing landing (`landing.tsx`); `components/auth/` — auth UI (`sign-in-card.tsx`).
- `lib/site-content.ts` — landing **copy/data** (features, plans, reviews, faqs, destinations, gallery) + theme tokens (`greenBadge`, `blueBadge`, `HL_*`, `hl()`). Edit content here, not inline in components.
- Route files in `app/**/page.tsx` stay thin — a Server Component that renders a component from `components/` (and may export `metadata`).

## 🔒 Data Access Layer (DAL) — the rule

**All data access goes through the Data Access Layer in `data/`. Every time. No exceptions.**

This is a [Next.js data-security](https://nextjs.org/docs/app/guides/data-security) requirement, not a style preference. When adding any feature that reads or writes data:

1. **Put the query in `data/`**, not in a component, route, or action. Each `data/*.ts` file starts with `import "server-only";`.
2. **Authenticate inside the DAL** — use `getCurrentUser()` / `requireUser()` from `data/auth.ts`. Never trust a page-level check to protect a query.
3. **Authorize inside the DAL** — check that the user may act on _this specific resource_ (ownership/membership), not just that they're logged in. This prevents IDOR. See `deleteEvent` and `assertEventMember` in `data/events.ts`.
4. **Return DTOs, never raw rows** — map to the minimal shape the caller needs (see `data/dto.ts`, and the `toXxxDTO` helpers). Never return secret/internal columns (`storage_key`, `share_token`, `password`, email, plan, etc.) unless the caller is authorized for them.
5. **Only the DAL (and the `server-only` modules it uses) may touch `db` or read secret `process.env`** values. Components, routes, and actions must not import `@/db`, `@/lib/auth`, or `@/lib/s3` for their own queries — go through `data/`.

### Existing DAL modules

- `data/auth.ts` — cached `getSession` / `getCurrentUser`, `requireUser`.
- `data/dto.ts` — shared DTO types + mappers.
- `data/uploads.ts` — S3 upload references.
- `data/events.ts` — events + membership/ownership guards (`assertEventViewable`, `assertEventMember`).
- `data/media.ts` — media respecting `event`/`restricted` visibility + `media_access` grants.

## Server Actions

Actions in `app/actions.ts` (or co-located `"use server"` files) must be **thin**: call the DAL, then `revalidatePath`. They must:

- **Re-verify auth/authz inside the action or its DAL call** — a Server Action is a separate POST entry point; page-level auth does NOT protect it.
- **Validate all client input** (form data, params, searchParams — all untrusted).
- **Return only what the UI needs** (e.g. `{ success: true }`, an id) — never a raw DB record.
- Never perform mutations during render; mutate only in actions.

## Client Components

- Only ever receive **DTOs** as props — never raw DB rows or the session object. Keep prop types narrow.
- Never import `@/db`, `@/lib/auth`, `@/lib/s3`, or any `@/data/*` module (they are `server-only` and will error).
- `NEXT_PUBLIC_*` env vars are the only ones available client-side.

## Commands

```bash
pnpm dev              # dev server
pnpm build            # production build
pnpm lint             # eslint
pnpm format           # prettier --write .
pnpm db:generate      # generate a migration from the Drizzle schema
pnpm db:migrate       # apply migrations (needs DATABASE_URL)
pnpm db:push          # push schema directly (dev only)
pnpm db:studio        # drizzle studio
```

Prettier + ESLint run on staged files via a Husky `pre-commit` hook (lint-staged).

## Schema & migrations

- Table definitions live in `db/`: `enums.ts`, `plans-schema.ts`, `auth-schema.ts` (Better Auth + extended `user`), `event-schema.ts`, `media-schema.ts`; all re-exported from `db/schema.ts`.
- `user` is the single source of truth for people. App fields `username`, `display_name`, `is_active`, `plan_id` live on it; the Better Auth admin plugin adds `role` (default `"user"`), `banned`, `ban_reason`, `ban_expires` (and `impersonated_by` on `session`). Domain tables FK to `user.id` (text).
- Change the schema → `pnpm db:generate`. Triggers/functions/views that Drizzle can't express go in a **custom** migration (`pnpm exec drizzle-kit generate --custom --name ...`). After changing Better Auth config/plugins, regenerate `db/auth-schema.ts` with `pnpm dlx @better-auth/cli generate`.
- Do not commit real secrets. `.env` is gitignored; keep `.env.example` in sync.

## Audit checklist (when reviewing changes)

- Is new data access in `data/` and `server-only`? No `db`/secret imports outside it.
- `"use client"` files: are prop types narrow (DTOs only)? No server-only imports?
- `"use server"` files: input validated? user re-authorized _and_ resource ownership checked? return value filtered? DB work delegated to the DAL?
- `[param]` folders are user input — are params validated?
- `route.ts` handlers: treat as public POST/GET entry points; verify auth inside.
