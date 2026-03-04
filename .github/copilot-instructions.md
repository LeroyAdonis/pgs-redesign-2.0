# Copilot Instructions — Purple Glow Social 2.0

South African social media management platform built with Next.js 16, React 19, and Tailwind CSS v4.

## Build, Test & Lint

```bash
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build
npm run lint             # ESLint (flat config)
npm run lint:fix         # ESLint auto-fix
npm run format:check     # Prettier check
npm run typecheck        # tsc --noEmit

# Tests (Vitest + happy-dom)
npm test                 # Run full suite (~1500 tests)
npx vitest run src/lib/credits/__tests__/credit-service.test.ts   # Single file
npx vitest run -t "should deduct credits"                         # By test name

# Database (Drizzle + Neon PostgreSQL)
npm run db:generate      # Generate migrations from schema changes
npm run db:push          # Push schema directly (dev only)
npm run db:migrate       # Run migrations
```

## Architecture

### Route Structure

All pages live under `src/app/[locale]/` with `next-intl` prefix-based routing (`localePrefix: "always"`). Route groups partition the app:

- `(admin)/admin/` — Admin dashboard, guarded by `requireAdminSession()` in layout
- `(auth)/` — Login, signup, password reset
- `(dashboard)/dashboard/` — Authenticated user area, guarded by `requireServerSession()`
- `(docs)/docs/` — Public documentation (server components with `getTranslations`)
- `(legal)/legal/` — Public legal pages

### Auth Pattern

- **Server**: `better-auth` with Drizzle adapter on Neon PostgreSQL. Database-backed sessions (not JWT).
  - `getServerSession()` / `requireServerSession()` from `@/lib/auth-session`
  - `requireAdminSession()` from `@/lib/admin-session` — checks `role === "admin"`
- **Client**: `authClient` from `@/lib/auth-client` (uses `better-auth/react`)
- Admin API routes check auth inline (getServerSession + role check returning 401/403). Admin pages rely on the layout guard.

### Database

- **Drizzle ORM** on **Neon PostgreSQL** (HTTP driver for serverless). Schema at `src/db/schema.ts`.
- Lazy-initialized singleton via Proxy in `src/db/index.ts` — safe to import during build.
- Conventions: cuid2 PKs, `timestamptz` for all timestamps, singular table names (`user` not `users`), `snake_case` columns.
- Better-auth manages `user`, `session`, `account`, `verification` tables — don't add application columns to these.

### Background Jobs

**Inngest** for async processing. Functions registered in `src/app/api/inngest/route.ts`. New function files must be:
1. Created in `src/inngest/`
2. Exported from `src/inngest/index.ts`
3. Added to the `functions` array in the route handler

### Billing & Credits

- **Polar.sh** for subscription billing. Tiers: `seedling` (free) → `hustler` → `grower` → `mogul`. All prices in ZAR.
- Tier config is the single source of truth at `src/lib/payments/tier-config.ts`.
- Credit system: `addCredits()` only accepts `allocation`/`purchase`/`bonus` types. Use direct `db.insert` for `rollover`/`expiry`.
- Tier enforcement via `checkTierLimit(orgId, limitType)` in `src/lib/payments/tier-enforcement.ts`.

### i18n

- **11 South African official languages** (en, af, zu, xh, nso, tn, st, ts, ss, ve, nr). Messages in `src/i18n/messages/`.
- Server components: `getTranslations('namespace')` from `next-intl/server`
- Client components: `useTranslations('namespace')` from `next-intl`
- Use `Link`, `useRouter`, `redirect` from `@/i18n/navigation` — never from `next/link` or `next/navigation` directly.
- Dynamic translation keys use lookup maps (e.g., `STATUS_KEYS`, `LIMIT_TYPE_KEYS`).

## Key Conventions

### Next.js 16 / React 19

- `params` is a `Promise` in layouts and pages — always `await params`.
- Server components call `setRequestLocale(locale)` for static rendering.
- The `'use client'` boundary pattern: server components pass `initialData` props to client components.
- ESLint enforces React 19 purity: no `Math.random()` in render, no `setState` in `useEffect`, no `ref.current` in render.

### Styling

- **Tailwind CSS v4** — CSS-first config. All design tokens in `src/app/globals.css` `@theme` block, no `tailwind.config.js`.
- Brand colors: `purple-*` palette, `brand`, `brand-vivid`, `brand-deep`. Accent: `accent` (pink).
- Admin dashboard: dark theme using `slate-900/950` backgrounds, `slate-700/50` borders, `slate-200` text.
- Z-index scale: `z-50` (dropdowns), `z-100` (sticky headers), `z-[200]` (mobile menu), `z-[300]` (modal backdrop), `z-[400]` (modal content).
- Fonts: Sora (body, `--font-body`), JetBrains Mono (code, `--font-mono`).

### Testing

- **Vitest** with **happy-dom** environment and **Testing Library** (React).
- Tests go in `__tests__/` directories adjacent to the code they test.
- Setup file: `src/test/setup.ts` (imports `@testing-library/jest-dom/vitest`).
- Inngest function tests: mock `@/inngest/client` with `createFunction: (...args) => args[args.length - 1]` to extract the raw handler. Call with `{ step: { run: mockFn }, event: { data } }`.
- i18n in tests: mock `useTranslations` as `(key: string) => key`.
- When testing text that also appears in filter dropdowns, scope queries with `within(getByTestId('...'))`.

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json` and `vitest.config.ts`).

### South African Context

- Timezone: `Africa/Johannesburg` (SAST, UTC+2) — constant `TIMEZONE_SAST`
- Currency: ZAR — constant `CURRENCY_ZAR`
- Locale formatting uses `en-ZA`
- OAuth tokens are AES-256-GCM encrypted before storage (`src/lib/crypto/`)
