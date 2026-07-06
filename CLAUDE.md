# CLAUDE.md

Guidance for working in this repository.

## Project

Next.js 16 (App Router) event-sharing platform. TypeScript, Tailwind v4, pnpm.

- **Auth:** Better Auth (email/password + Google OAuth, **admin plugin** for roles) — `lib/auth.ts`, client in `lib/auth-client.ts`, route at `app/api/auth/[...all]/route.ts`.
- **DB:** PostgreSQL (Neon) via Drizzle ORM (node-postgres). Schema in `db/`, migrations in `drizzle/`.
- **Storage:** S3 uploads via presigned URLs — `lib/s3.ts`, `app/api/presigned`, `app/api/uploads`.
- **Domain:** plans → users → events → event_members / media / media_access. Business rules (owner auto-add, storage sync, plan quotas, member caps) live in the `drizzle/*_event_rules` SQL migration; the schema ERD is `schema_erd.mermaid`.

## 🎨 UI — Sketchbook UI (default)

**Build all UI with [RetroUI](https://retroui.dev/) — a neobrutalist [shadcn](https://ui.shadcn.com/) registry.** Components are shadcn-style and vendored into `components/ui/` (own the code, edit freely). Reach for a plain HTML element only when no primitive fits — and say so.

- **Import from `@/components/ui/<name>`**, e.g. `import { Button } from "@/components/ui/button"`, `import { Card, CardContent } from "@/components/ui/card"`. These are composition-based (`CardHeader`/`CardContent`, `DialogTrigger`/`DialogContent`, `SelectTrigger`/`SelectContent`, `AccordionItem`/`AccordionTrigger`/`AccordionContent`). Underlying primitives are the unified `radix-ui` package; styling uses `cva` + `cn` (`@/lib/utils`).
- **Add more components** with the shadcn CLI (registries are wired in `components.json`): `pnpm dlx shadcn@latest add @retroui/<name>` (Radix) or `@retroui-base/<name>` (Base UI). `pnpm dlx shadcn@latest list @retroui` to browse. The **shadcn MCP server** is configured globally, so you can also browse/add via MCP.
- **Client-only:** interactive primitives are `"use client"`. Server Components must delegate to a client child (see `app/page.tsx` → `components/landing/landing.tsx`).
- **Theme:** neobrutalist — yellow primary (`--primary #ffdc58`), cream bg (`#fff7e8`), black borders (`border-2`), hard offset shadows, square corners (`--radius 0`). Tokens (`bg-primary`, `text-muted-foreground`, `border-border`, `bg-card`, `shadow-md`, …) live in `app/globals.css` (`:root` + `.dark`). Prefer tokens over ad-hoc hexes.
- **Fonts** are centralized in `lib/fonts.ts` (loaded on `<html>` in `app/layout.tsx`): `font-head` = Archivo Black (headings), `font-sans` = Space Grotesk (body), `font-hand` = Caveat (**the `<Logo>` wordmark only** — keep it), `font-pixel` = Geist Pixel Square (retro number/eyebrow accent; local woff2 in `lib/fonts/`).
- **Toasts** use [sonner](https://sonner.emilkowal.ski/): `import { toast } from "sonner"` → `toast.success/error/warning/info(msg)`. The `<Toaster/>` is mounted once in `app/providers.tsx`.
- **Available components:** button, card, badge, input, label, textarea, select, avatar, radio-group, progress, switch, slider, dropdown-menu, checkbox, accordion, separator, dialog, sonner (plus anything else you `add`).
- **The landing page** (`components/landing/landing.tsx`) is the RetroUI usage reference — it exercises the full set. `lib/site-content.ts` holds its copy/data.

## 📁 Components & reuse

Shared components live under `components/` (never `app/_components`). When you build something used in more than one place, extract it here rather than duplicating.

- `components/ui/` — RetroUI primitives (button, card, dialog, …) plus app widgets: `logo.tsx` (`<Logo>` wordmark), `google-icon.tsx`, `card-fan-carousel.tsx`.
- `components/` — larger reusable widgets: `globe-polaroids.tsx` (cobe globe).
- `components/landing/` — the marketing landing (`landing.tsx`); `components/auth/` — auth UI (`sign-in-card.tsx`).
- `lib/site-content.ts` — landing **copy/data** (features, plans, reviews, faqs, destinations, gallery) + hero highlighter helpers (`HL_*`, `hl()`). Edit content here, not inline in components.
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
