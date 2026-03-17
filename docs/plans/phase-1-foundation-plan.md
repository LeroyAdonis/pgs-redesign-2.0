# Phase 1: Foundation & Infrastructure — Detailed Implementation Plan

**Date:** 2026-07-17  
**Status:** Ready for Implementation  
**Author:** Planner Agent  
**Dependencies researched:** Next.js 16, React 19.2, Tailwind CSS v4, Better-auth, Drizzle ORM, Neon PostgreSQL, next-intl

---

## Summary

Phase 1 bootstraps Purple Glow Social 2.0 from a blank canvas (the repo currently contains only static HTML design system reference files, a minimal `package.json` with Playwright, and `.github` agent/skill configs) into a fully operational Next.js 16 application with database, authentication, internationalization, and a React component design system. All five tasks have inter-dependencies: scaffolding (1.1) must come first, database (1.2) before auth (1.3), and scaffolding before i18n (1.4) and design system (1.5). The design system migration (1.5) depends on i18n being in place because components like the language toggle are part of the design system.

---

## Current State Assessment

### What Exists
| Asset | Status | Notes |
|-------|--------|-------|
| `package.json` | ⚠️ Minimal | Only `playwright` dependency, `"type": "commonjs"` |
| `ds-part1.html` | ✅ Complete | Design tokens, form components (buttons, inputs, selects, toggles, checkboxes, radios, file upload, date/time), feedback states (toasts, alerts, badges, empty states, loading, connection status) |
| `ds-part2.html` | ✅ Complete | Summary/overview of all component categories |
| `ds-s04-nav.html` | ✅ Complete | Navigation: navbar, sidebar, tabs, breadcrumbs, pagination |
| `ds-s05-data.html` | ✅ Complete | Data display: cards, tables, stats/KPI widgets, avatars, lists, tooltips |
| `ds-s06-overlays.html` | ✅ Complete | Overlays: modals, drawers, dropdowns, popovers, command palette |
| `ds-s07-layout.html` | ✅ Complete | Layout: app shell, dashboard grid, containers, dividers, responsive |
| `index.html` | ✅ Landing page v1 | Static HTML |
| `index-v2.html` | ✅ Landing page v2 | Static HTML (uses **different** fonts: Playfair Display + Inter) |
| `.github/skills/` | ✅ Configured | Agent skills for development workflow |
| `.github/agents/` | ✅ Configured | Agent definitions (coder, planner, orchestrator, etc.) |
| `docs/plans/` | ✅ Design doc + impl plan | Architecture, schema, routes fully designed |
| Next.js setup | ❌ Missing | No `src/`, no `app/`, no `tsconfig.json`, no `next.config.ts` |
| Database | ❌ Missing | No schema, no Drizzle config, no migrations |
| Auth | ❌ Missing | No auth setup |
| i18n | ❌ Missing | No translations, no locale routing |

### ⚠️ Font Inconsistency Discovered
- **Design system** (ds-*.html): Instrument Serif (display) + Sora (body) + JetBrains Mono (code)
- **Landing page v2** (index-v2.html): Playfair Display (display) + Inter (body)
- **Decision needed:** Use the design system fonts (Instrument Serif + Sora + JetBrains Mono) as the canonical set. The design system is newer and more comprehensive. The landing page will be rebuilt in Phase 2 using these fonts.

---

## Recommended Execution Order

```
1.1 Next.js Scaffolding ──┬──→ 1.2 Database Schema ──→ 1.3 Better-auth
                          ├──→ 1.4 i18n Setup ─────────┐
                          └──→ 1.5 Design System ←──────┘
```

**Parallelization opportunities:**
- After 1.1 completes: 1.2 and 1.4 can run in parallel
- 1.3 depends on both 1.1 and 1.2
- 1.5 depends on 1.1 and 1.4 (components need i18n support from day one)
- Alternatively, 1.5 can start after 1.1 with i18n integrated retroactively

**Recommended serial order:** 1.1 → 1.2 → 1.3 → 1.4 → 1.5

---

## Task 1.1: Next.js 16 Scaffolding

### Objective
Initialize a Next.js 16 + React 19 + TypeScript project with Tailwind CSS v4, ESLint, and Prettier.

### Key Decisions
1. **Use `create-next-app`** with `--typescript --tailwind --eslint --app` flags. This gives us Next.js 16 + Tailwind v4 + TypeScript + ESLint in one command.
2. **Source directory:** Use `src/` prefix (standard for larger apps)
3. **Package manager:** npm (already has package-lock.json)
4. **Turbopack:** Next.js 16 default — no webpack config needed
5. **Module type:** Switch from `"type": "commonjs"` to `"type": "module"` (Next.js 16 default)

### Implementation Steps

1. **Preserve existing files** — Move `ds-*.html`, `index*.html`, `test_*.js`, and `docs/` to a temporary location or ensure `create-next-app` doesn't overwrite them. Recommendation: run `create-next-app` in a temp dir, then merge structure.

2. **Run scaffolding** in a temp directory:
   ```sh
   npx create-next-app@latest pgs-temp --typescript --tailwind --eslint --app --src-dir
   ```

3. **Merge into existing repo:**
   - Copy `src/`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `.eslintrc.json` into the repo root
   - Update `package.json` (merge dependencies, keep existing scripts, update metadata)
   - Keep existing `.git`, `.github`, `docs/`, `ds-*.html` files

4. **Install Prettier and configure:**
   ```sh
   npm install -D prettier eslint-config-prettier prettier-plugin-tailwindcss
   ```
   Create `.prettierrc`:
   ```json
   {
     "semi": false,
     "singleQuote": true,
     "tabWidth": 2,
     "trailingComma": "es5",
     "plugins": ["prettier-plugin-tailwindcss"]
   }
   ```

5. **Create folder structure** under `src/`:
   ```
   src/
     app/                    # App Router pages
       [locale]/             # i18n dynamic segment (created in 1.4)
         layout.tsx
         page.tsx
       api/                  # API routes
         auth/[...all]/      # Better-auth catch-all (created in 1.3)
       layout.tsx            # Root layout
       globals.css           # Tailwind v4 entry
     components/             # Shared React components
       ui/                   # Design system primitives
       layout/               # Shell, sidebar, header
       forms/                # Form components
       feedback/             # Toasts, alerts, badges
       data/                 # Tables, cards, stats
       navigation/           # Nav, tabs, breadcrumbs
       overlays/             # Modals, drawers, dropdowns
     lib/                    # Utilities, helpers, constants
       auth.ts               # Better-auth config (created in 1.3)
       auth-client.ts        # Client-side auth (created in 1.3)
       db.ts                 # Drizzle instance (created in 1.2)
       utils.ts              # Shared utilities
     db/                     # Database
       schema.ts             # Drizzle schema (created in 1.2)
       migrations/           # Generated migrations
     i18n/                   # i18n config (created in 1.4)
       messages/             # Translation JSON files
       config.ts             # next-intl configuration
     styles/                 # Additional styles
       theme.css             # Purple Glow theme tokens
   ```

6. **Configure Tailwind v4 theme** in `src/app/globals.css`:
   ```css
   @import "tailwindcss";
   
   @theme {
     --color-purple: #8B5CF6;
     --color-purple-vivid: #A78BFA;
     --color-purple-deep: #6D28D9;
     --color-purple-surface: rgba(139, 92, 246, 0.12);
     /* ... all tokens from design system */
     --font-display: 'Instrument Serif', Georgia, serif;
     --font-body: 'Sora', sans-serif;
     --font-mono: 'JetBrains Mono', monospace;
   }
   ```

7. **Configure `next.config.ts`** (minimal for now):
   ```ts
   import type { NextConfig } from 'next'
   const nextConfig: NextConfig = {
     // Will be extended with i18n, auth, etc.
   }
   export default nextConfig
   ```

8. **Update `.gitignore`** — Ensure `node_modules`, `.next`, `.env.local`, `.env` are ignored.

9. **Add npm scripts:**
   ```json
   {
     "dev": "next dev --turbopack",
     "build": "next build",
     "start": "next start",
     "lint": "next lint",
     "format": "prettier --write .",
     "format:check": "prettier --check .",
     "db:generate": "drizzle-kit generate",
     "db:push": "drizzle-kit push",
     "db:studio": "drizzle-kit studio"
   }
   ```

10. **Verify:** Run `npm run dev` and confirm the app loads on `localhost:3000`.

### Risks & Gotchas
- **`create-next-app` overwrites files:** Must be run in a temp dir or use `--no-git` flag, then cherry-pick files
- **Tailwind v4 paradigm shift:** No `tailwind.config.js`. All customization goes in CSS via `@theme`. Agents accustomed to v3 may instinctively create a config file — reject it.
- **CSS `@apply` in modules:** Requires `@reference "../app/globals.css"` directive in Tailwind v4
- **Font loading:** Use `next/font/google` for Instrument Serif, Sora, JetBrains Mono — not CDN `<link>` tags

---

## Task 1.2: Database Schema & Drizzle ORM

### Objective
Design and implement the full Drizzle ORM schema on Neon PostgreSQL with all tables specified in the design doc.

### Key Decisions
1. **Drizzle over Prisma:** Chosen per design doc. SQL-like API, better serverless performance, smaller bundle.
2. **Neon serverless driver:** Use `@neondatabase/serverless` for HTTP-based connections (Vercel-friendly)
3. **ID strategy:** Use `text` with `cuid2` for all primary keys (Better-auth compatible, no UUID collisions)
4. **Timestamps:** Use `timestamptz` (timezone-aware) for all timestamp columns
5. **Better-auth tables:** Let Better-auth's schema generation create its required tables (`user`, `session`, `account`, `verification`). Our app tables reference these.

### Implementation Steps

1. **Install dependencies:**
   ```sh
   npm install drizzle-orm @neondatabase/serverless
   npm install -D drizzle-kit dotenv
   ```

2. **Create `.env.local`:**
   ```
   DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

3. **Create `drizzle.config.ts`:**
   ```ts
   import { defineConfig } from 'drizzle-kit'
   export default defineConfig({
     schema: './src/db/schema.ts',
     out: './src/db/migrations',
     dialect: 'postgresql',
     dbCredentials: { url: process.env.DATABASE_URL! },
   })
   ```

4. **Create `src/lib/db.ts`:**
   ```ts
   import { drizzle } from 'drizzle-orm/neon-http'
   import * as schema from '@/db/schema'
   export const db = drizzle(process.env.DATABASE_URL!, { schema })
   ```

5. **Create `src/db/schema.ts`** with ALL tables:

   **Better-auth managed tables** (generated via `npx @better-auth/cli generate`):
   - `user` — id, name, email, emailVerified, image, role, createdAt, updatedAt
   - `session` — id, userId, token, expiresAt, ipAddress, userAgent
   - `account` — id, userId, accountId, providerId, accessToken, refreshToken, etc.
   - `verification` — id, identifier, value, expiresAt

   **Application tables:**
   - `organizations` — id, name, slug, ownerId (→ user), tier, logoUrl, createdAt, updatedAt
   - `organization_members` — id, orgId, userId, role (owner/admin/member), joinedAt
   - `social_accounts` — id, orgId, platform (enum: instagram/facebook/twitter/linkedin/tiktok/whatsapp/google_business), platformUserId, displayName, accessTokenEncrypted, refreshTokenEncrypted, tokenExpiresAt, isActive, connectedAt
   - `brand_profiles` — id, orgId, socialAccountId (nullable), language, toneFingerprint (jsonb), vocabularyClusters (jsonb), hashtagPatterns (jsonb), postingCadence (jsonb), emojiUsage (jsonb), avgContentLength, visualStyle (jsonb), createdAt, updatedAt
   - `posts` — id, orgId, createdById (→ user), content, contentLanguage, platform, status (enum: draft/scheduled/publishing/published/failed), aiGenerated (boolean), aiPrompt, aiModel, createdAt, updatedAt
   - `post_media` — id, postId, mediaType (enum: image/video/gif), url, altText, width, height, sizeBytes, sortOrder
   - `post_schedules` — id, postId, socialAccountId, scheduledAt, publishedAt, failedAt, retryCount, lastError, createdAt
   - `credits` — id, orgId, balance, monthlyAllocation, rolloverBalance, rolloverExpiresAt, lastResetAt
   - `credit_transactions` — id, orgId, type (enum: allocation/deduction/purchase/rollover/expiry), amount, description, postId (nullable), createdAt
   - `analytics` — id, postScheduleId, impressions, reach, likes, shares, comments, clicks, engagementRate, fetchedAt
   - `notifications` — id, userId, orgId (nullable), type, title, message, data (jsonb), readAt, createdAt
   - `subscriptions` — id, orgId, tier (enum: seedling/hustler/grower/mogul), polarSubscriptionId, status (enum: active/past_due/canceled/trialing), currentPeriodStart, currentPeriodEnd, canceledAt, createdAt

6. **Define enums** as `pgEnum`:
   ```ts
   export const platformEnum = pgEnum('platform', [
     'instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'whatsapp', 'google_business'
   ])
   export const postStatusEnum = pgEnum('post_status', [
     'draft', 'scheduled', 'publishing', 'published', 'failed'
   ])
   export const tierEnum = pgEnum('tier', [
     'seedling', 'hustler', 'grower', 'mogul'
   ])
   // ... etc.
   ```

7. **Define relations** using Drizzle's `relations()` helper for type-safe queries.

8. **Generate and push migration:**
   ```sh
   npx drizzle-kit generate
   npx drizzle-kit push
   ```

9. **Verify:** Open Drizzle Studio (`npx drizzle-kit studio`) and confirm all tables exist in Neon.

### Risks & Gotchas
- **Better-auth table naming:** Better-auth expects specific table names (`user` not `users`). If we want plural names, we must configure the schema mapping in the Drizzle adapter: `schema: { ...schema, user: schema.users }`. **Recommendation: use Better-auth's singular naming convention** for its tables to avoid mapping complexity.
- **Token encryption:** `accessTokenEncrypted` and `refreshTokenEncrypted` should be encrypted at the application layer before storage. Do NOT store plain tokens. Use a library like `node:crypto` AES-256-GCM. The encryption key goes in env vars.
- **Neon cold starts:** First query after idle may be slow (500ms+). Consider connection pooling or keep-alive strategies for production.
- **Migration conflicts:** If multiple agents work on schema simultaneously, migration files will conflict. Use `drizzle-kit push` during development, only generate migration files for production.
- **JSONB columns:** `toneFingerprint`, `vocabularyClusters`, etc. are unstructured. Define TypeScript types for their expected shapes even though they're stored as JSONB.

---

## Task 1.3: Better-auth Setup

### Objective
Configure Better-auth with email/password + social OAuth (Google, GitHub), session management, and middleware for protected routes.

### Key Decisions
1. **Better-auth over NextAuth:** Design doc specifies Better-auth. TypeScript-native, Drizzle adapter built-in.
2. **Social providers for app auth:** Google and GitHub (for signing IN to the PGS platform). NOT the same as social account linking (Instagram, Facebook, etc.) which is Phase 3.
3. **Session strategy:** Database sessions (not JWT) — allows server-side session invalidation
4. **User role:** Add `role` field to user table (user/admin) for admin dashboard access

### Implementation Steps

1. **Install dependencies:**
   ```sh
   npm install better-auth
   npm install -D @better-auth/cli
   ```

2. **Generate Better-auth schema** (adds required columns/tables to Drizzle schema):
   ```sh
   npx @better-auth/cli generate --output src/db/schema.ts
   ```
   Review and merge generated schema with existing tables from step 1.2.

3. **Create `.env.local` additions:**
   ```
   BETTER_AUTH_SECRET=<generate-32-char-random-secret>
   BETTER_AUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=<from-google-cloud-console>
   GOOGLE_CLIENT_SECRET=<secret>
   GITHUB_CLIENT_ID=<from-github-settings>
   GITHUB_CLIENT_SECRET=<secret>
   ```

4. **Create `src/lib/auth.ts`** (server-side config):
   ```ts
   import { betterAuth } from 'better-auth'
   import { drizzleAdapter } from 'better-auth/adapters/drizzle'
   import { db } from './db'
   import * as schema from '@/db/schema'

   export const auth = betterAuth({
     database: drizzleAdapter(db, {
       provider: 'pg',
       schema,
     }),
     emailAndPassword: { enabled: true },
     socialProviders: {
       google: {
         clientId: process.env.GOOGLE_CLIENT_ID!,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
       },
       github: {
         clientId: process.env.GITHUB_CLIENT_ID!,
         clientSecret: process.env.GITHUB_CLIENT_SECRET!,
       },
     },
     session: {
       expiresIn: 60 * 60 * 24 * 7, // 7 days
       updateAge: 60 * 60 * 24,      // Update session every 24h
     },
     advanced: {
       generateId: false, // Let Drizzle/schema handle ID generation
     },
   })

   export type Session = typeof auth.$Infer.Session
   ```

5. **Create API route** at `src/app/api/auth/[...all]/route.ts`:
   ```ts
   import { auth } from '@/lib/auth'
   import { toNextJsHandler } from 'better-auth/next-js'
   export const { GET, POST } = toNextJsHandler(auth)
   ```

6. **Create `src/lib/auth-client.ts`** (client-side):
   ```ts
   import { createAuthClient } from 'better-auth/react'
   export const authClient = createAuthClient({})
   ```

7. **Create middleware** at `src/middleware.ts`:
   ```ts
   import { NextRequest, NextResponse } from 'next/server'
   import { auth } from '@/lib/auth'

   const protectedRoutes = ['/dashboard', '/admin']
   const adminRoutes = ['/admin']

   export async function middleware(request: NextRequest) {
     const session = await auth.api.getSession({ headers: request.headers })

     // Redirect unauthenticated users
     if (!session && protectedRoutes.some(r => request.nextUrl.pathname.startsWith(r))) {
       return NextResponse.redirect(new URL('/login', request.url))
     }

     // Redirect non-admin users from admin routes
     if (session && adminRoutes.some(r => request.nextUrl.pathname.startsWith(r))) {
       if (session.user.role !== 'admin') {
         return NextResponse.redirect(new URL('/dashboard', request.url))
       }
     }

     return NextResponse.next()
   }

   export const config = {
     matcher: ['/dashboard/:path*', '/admin/:path*'],
   }
   ```

8. **Create auth provider wrapper** in `src/components/providers/auth-provider.tsx` for client components that need session state.

9. **Verify:** Start dev server, navigate to `/api/auth/sign-up/email` with POST body to create test user, then sign in.

### Risks & Gotchas
- **Middleware collision with next-intl:** Both Better-auth and next-intl want to run middleware. They must be composed into a single `middleware.ts`. The middleware should handle locale detection FIRST, then auth checks. See Task 1.4 for the combined approach.
- **Better-auth schema generation may overwrite manual schema changes.** Run `generate` once, then manually maintain the schema going forward.
- **`auth.api.getSession` in middleware:** This makes a database call per request. Ensure Neon connection is fast. Consider caching session in a cookie for middleware and only validating server-side on page loads.
- **OAuth redirect URIs:** Must be configured correctly in Google Cloud Console and GitHub Developer Settings. Callback URL: `http://localhost:3000/api/auth/callback/google` (and `/github`).
- **BETTER_AUTH_SECRET must never be committed.** Add to `.env.local` (git-ignored) and Vercel env vars.

---

## Task 1.4: i18n Setup (next-intl)

### Objective
Configure next-intl with all 11 SA official languages, locale-prefixed routing, and a language toggle component.

### Key Decisions
1. **Routing strategy:** `/[locale]/...` prefix for all pages (e.g., `/en/dashboard`, `/zu/dashboard`)
2. **Default locale:** `en` (English), with prefix optional for default
3. **Initial translations:** English only in Phase 1. Other 10 languages get stub files with fallback to English. Full translations happen in a later phase.
4. **Translation scope:** UI strings only in Phase 1 (buttons, labels, navigation). Content generation in SA languages is Phase 4.

### 11 Supported Locales
| Code | Language | Status in Phase 1 |
|------|----------|-------------------|
| `en` | English | ✅ Full translations |
| `af` | Afrikaans | 🔲 Stub (fallback to en) |
| `zu` | isiZulu | 🔲 Stub |
| `xh` | isiXhosa | 🔲 Stub |
| `nso` | Sepedi | 🔲 Stub |
| `tn` | Setswana | 🔲 Stub |
| `st` | Sesotho | 🔲 Stub |
| `ts` | Xitsonga | 🔲 Stub |
| `ss` | siSwati | 🔲 Stub |
| `ve` | Tshivenḓa | 🔲 Stub |
| `nr` | isiNdebele | 🔲 Stub |

### Implementation Steps

1. **Install next-intl:**
   ```sh
   npm install next-intl
   ```

2. **Create translation files** at `src/i18n/messages/`:
   ```
   messages/
     en.json    # Full English translations
     af.json    # Stub: { "common": { ... } } with en values
     zu.json    # Stub
     ... (9 more stubs)
   ```
   
   Structure for `en.json`:
   ```json
   {
     "common": {
       "appName": "Purple Glow Social",
       "tagline": "AI-Powered Social Media for Mzansi",
       "signIn": "Sign In",
       "signUp": "Sign Up",
       "signOut": "Sign Out",
       "dashboard": "Dashboard",
       "settings": "Settings",
       "loading": "Loading...",
       "error": "Something went wrong",
       "save": "Save",
       "cancel": "Cancel",
       "delete": "Delete",
       "edit": "Edit",
       "back": "Back",
       "next": "Next"
     },
     "nav": {
       "home": "Home",
       "dashboard": "Dashboard",
       "accounts": "Accounts",
       "generate": "Content Studio",
       "posts": "Posts",
       "calendar": "Calendar",
       "analytics": "Analytics",
       "brand": "Brand",
       "billing": "Billing",
       "settings": "Settings",
       "team": "Team"
     },
     "auth": {
       "signInTitle": "Welcome back",
       "signUpTitle": "Create your account",
       "email": "Email address",
       "password": "Password",
       "forgotPassword": "Forgot password?",
       "continueWithGoogle": "Continue with Google",
       "continueWithGithub": "Continue with GitHub",
       "noAccount": "Don't have an account?",
       "hasAccount": "Already have an account?"
     }
   }
   ```

3. **Create i18n routing config** at `src/i18n/routing.ts`:
   ```ts
   import { defineRouting } from 'next-intl/routing'
   
   export const routing = defineRouting({
     locales: ['en', 'af', 'zu', 'xh', 'nso', 'tn', 'st', 'ts', 'ss', 've', 'nr'],
     defaultLocale: 'en',
   })
   ```

4. **Create navigation helpers** at `src/i18n/navigation.ts`:
   ```ts
   import { createNavigation } from 'next-intl/navigation'
   import { routing } from './routing'
   export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
   ```

5. **Create request config** at `src/i18n/request.ts`:
   ```ts
   import { getRequestConfig } from 'next-intl/server'
   import { routing } from './routing'
   
   export default getRequestConfig(async ({ requestLocale }) => {
     let locale = await requestLocale
     if (!locale || !routing.locales.includes(locale)) {
       locale = routing.defaultLocale
     }
     return {
       locale,
       messages: (await import(`./messages/${locale}.json`)).default,
     }
   })
   ```

6. **Create combined middleware** at `src/middleware.ts`:
   ```ts
   import createMiddleware from 'next-intl/middleware'
   import { routing } from '@/i18n/routing'
   import { NextRequest, NextResponse } from 'next/server'

   const intlMiddleware = createMiddleware(routing)
   
   export default async function middleware(request: NextRequest) {
     // Skip API routes and static files
     if (request.nextUrl.pathname.startsWith('/api/')) {
       // Handle auth protection for API routes if needed
       return NextResponse.next()
     }
     
     // Apply i18n routing
     const response = intlMiddleware(request)
     
     // Auth checks on protected routes
     // (Extract locale-stripped path, check if protected)
     // ... auth logic from 1.3 integrated here
     
     return response
   }

   export const config = {
     matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
   }
   ```

7. **Restructure app directory** for locale routing:
   ```
   src/app/
     [locale]/
       layout.tsx        # Locale-aware layout with NextIntlClientProvider
       page.tsx           # Landing page
       (auth)/
         login/page.tsx
         signup/page.tsx
       (dashboard)/
         dashboard/
           layout.tsx
           page.tsx
           accounts/page.tsx
           generate/page.tsx
           ...
       (admin)/
         admin/
           layout.tsx
           page.tsx
           ...
     api/
       auth/[...all]/route.ts
     layout.tsx           # Root layout (html, body, fonts)
     globals.css
   ```

8. **Add `next-intl` plugin to `next.config.ts`:**
   ```ts
   import createNextIntlPlugin from 'next-intl/plugin'
   const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
   
   const nextConfig = { /* ... */ }
   export default withNextIntl(nextConfig)
   ```

9. **Create LanguageToggle component** (part of design system, implemented here for i18n integration):
   ```tsx
   'use client'
   import { useLocale } from 'next-intl'
   import { useRouter, usePathname } from '@/i18n/navigation'
   
   export function LanguageToggle() {
     const locale = useLocale()
     const router = useRouter()
     const pathname = usePathname()
     // Dropdown with all 11 languages
   }
   ```

10. **Verify:** Navigate to `/en`, `/zu`, `/af` and confirm locale switching works with fallback to English.

### Risks & Gotchas
- **Middleware composition is the #1 risk.** next-intl's middleware rewrites URLs to add the locale prefix. Better-auth's middleware needs the un-prefixed path. The combined middleware must:
  1. Let `/api/*` routes bypass i18n completely
  2. Apply locale detection/rewrite for page routes
  3. Then apply auth checks using the locale-stripped path
- **11 translation files × many namespaces = maintenance burden.** Use a flat namespace structure. Consider tooling like `i18n-ally` VS Code extension for managing translations.
- **Locale codes:** `nso`, `ss`, `ve`, `nr` are non-standard BCP 47 codes but widely used for SA languages. Verify browser detection works for these.
- **SEO:** Each locale path needs proper `<html lang="">` attribute and `hreflang` alternate links for SEO.
- **Dynamic `import()` for messages:** Each locale's JSON is loaded dynamically. For 11 locales, this is fine. But ensure no locale file is missing or malformed.

---

## Task 1.5: Design System Migration

### Objective
Port all component HTML from `ds-*.html` files to React components using Tailwind CSS v4, implementing the Purple Glow theme tokens with dark/light mode support.

### Component Inventory (from HTML files)

#### ds-part1.html — Design Tokens + Forms + Feedback
| Category | Components | Priority |
|----------|-----------|----------|
| **Tokens** | Color palette, typography scale, spacing, shadows, radius, motion, z-index, breakpoints | P0 (foundation) |
| **Buttons** | Primary, Secondary, Ghost, Destructive (sm/md/lg), Icon Button, Button Group, Loading state | P0 |
| **Text Inputs** | Standard, Error, Success, Disabled, Character count, Search, Prefix addon | P0 |
| **Textarea** | Standard, Error, Success, Platform char limits | P1 |
| **Select** | Standard, Searchable, Multi-select with tags, Disabled | P1 |
| **Toggle Switch** | On/off, With label/description, Disabled | P1 |
| **Checkbox** | Checked, Unchecked, Indeterminate, Disabled | P1 |
| **Radio** | Radio group, Selected, Disabled | P1 |
| **File Upload** | Drag-drop zone, Previews, Progress bar, Error | P2 |
| **Date/Time Picker** | Date, Time, DateTime, Timezone badge, Disabled | P2 |
| **Toasts** | Success, Warning, Error, Info, Auto-dismiss | P0 |
| **Alerts** | Success, Warning, Error, Info, Compact | P0 |
| **Badges** | Status badges (6 variants), Platform badges (4), Language tags | P0 |
| **Empty States** | Illustration + title + description | P1 |
| **Loading** | Spinners (sm/md/lg), Skeletons (text/avatar/card), Progress bar, Full-page overlay | P0 |
| **Connection Status** | Status dots, Card, Offline banner | P2 |

#### ds-s04-nav.html — Navigation
| Component | Variants | Priority |
|-----------|---------|----------|
| **App Navbar** | Default, Sticky | P0 |
| **Sidebar Navigation** | Expanded, Collapsed (icon-only) | P0 |
| **Tabs** | Underline, Pill, Vertical | P1 |
| **Breadcrumbs** | Standard, With icons, Truncated | P1 |
| **Pagination** | Numbered, Compact, Load More, Page Size | P1 |

#### ds-s05-data.html — Data Display
| Component | Variants | Priority |
|-----------|---------|----------|
| **Cards** | Post Preview, Metric, Profile, Compact, Large | P0 |
| **Tables** | Standard (sort, select, status), Paginated, Action menus | P1 |
| **Stats/KPI** | Metric cards with trends, Sparkline, Up/Down indicators | P1 |
| **Avatars** | xs/sm/md/lg/xl, Platform overlay, Stack | P1 |
| **Lists** | Action list, Activity feed, Selectable | P1 |
| **Tooltips** | 4 directions, Rich tooltip | P2 |

#### ds-s06-overlays.html — Overlays
| Component | Variants | Priority |
|-----------|---------|----------|
| **Modal** | Standard with backdrop | P0 |
| **Drawer** | Right-side, Left-side | P1 |
| **Dropdown Menu** | Simple, Positioned right | P0 |
| **Popover** | User profile (hover), Action (click) | P2 |
| **Command Palette** | Search + results | P2 |

#### ds-s07-layout.html — Layout
| Component | Variants | Priority |
|-----------|---------|----------|
| **App Shell** | Sidebar + main content | P0 |
| **Dashboard Grid** | 12-col, KPI row, Split (2/3+1/3), Bento | P0 |
| **Containers** | Card, Section | P1 |
| **Dividers** | Horizontal, Vertical, Spacing scale | P2 |
| **Responsive** | Breakpoint reference, Stack↔Side-by-side | P1 |

### Key Decisions
1. **No component library dependency** (no shadcn/ui, Radix, etc.) — Build from the existing HTML/CSS as reference. This preserves the unique Purple Glow aesthetic.
2. **Use Tailwind v4 `@theme` tokens** — Map all CSS custom properties to Tailwind theme values
3. **Dark/light mode:** Use `data-theme` attribute on `<html>` (matching existing DS approach), toggle via React context + localStorage
4. **Component API:** Follow React 19 conventions. Server Components by default, `'use client'` only when interactivity is needed.
5. **Phase 1 scope:** Implement P0 components only. P1/P2 components will be built as needed in later phases.

### Implementation Steps

1. **Create theme tokens file** at `src/styles/theme.css`:
   Map all CSS custom properties from `ds-part1.html` to Tailwind v4 `@theme` variables.
   Also define `[data-theme="dark"]` and `[data-theme="light"]` CSS blocks for mode switching.

2. **Create ThemeProvider** at `src/components/providers/theme-provider.tsx`:
   ```tsx
   'use client'
   // Manages data-theme attribute on <html>
   // Persists preference in localStorage
   // Respects system preference as default
   // Provides useTheme() hook
   ```

3. **Implement P0 components in order:**
   
   a. **Layout primitives** (`src/components/layout/`):
      - `AppShell` — sidebar + main content wrapper
      - `DashboardGrid` — responsive grid system
      - `Container` — max-width content wrapper
   
   b. **UI primitives** (`src/components/ui/`):
      - `Button` — all variants (primary/secondary/ghost/destructive), sizes (sm/md/lg), loading state
      - `Input` — text input with label, helper, error, success states
      - `Badge` — status and platform badges
      - `Spinner` / `Skeleton` — loading states
   
   c. **Feedback** (`src/components/feedback/`):
      - `Toast` / `Toaster` — toast notification system with auto-dismiss
      - `Alert` — inline alert banners
   
   d. **Navigation** (`src/components/navigation/`):
      - `Navbar` — top app navigation bar
      - `Sidebar` — collapsible sidebar navigation
      - `DropdownMenu` — action dropdown menus
   
   e. **Data** (`src/components/data/`):
      - `Card` — base card component
      - `MetricCard` — stats/KPI display
   
   f. **Overlays** (`src/components/overlays/`):
      - `Modal` — dialog with backdrop
   
   g. **Theme** (`src/components/ui/`):
      - `ThemeToggle` — dark/light mode switch
      - `LanguageToggle` — locale switcher (from 1.4)

4. **Set up fonts** using `next/font/google` in root layout:
   ```tsx
   import { Sora, JetBrains_Mono } from 'next/font/google'
   // Note: "Instrument Serif" must be loaded via @next/font/google
   // if available, otherwise via CSS @font-face
   ```

5. **Create component documentation page** (optional dev-only route):
   `src/app/[locale]/(dev)/components/page.tsx` — Renders all components for visual verification against the HTML reference files.

6. **Verify:** Side-by-side comparison of React components vs. original HTML files. Dark/light mode toggle works. Theme tokens are consistent.

### Risks & Gotchas
- **Instrument Serif font availability:** This font may not be available in `next/font/google`. If not, use `@font-face` with self-hosted font files or fall back to the closest available Google Font.
- **CSS custom properties vs Tailwind @theme:** The design system uses `var(--purple)` syntax. Tailwind v4 uses `--color-purple` in `@theme`. Need a clear mapping strategy. Recommendation: Define both — Tailwind `@theme` for utility classes AND CSS custom properties for any custom CSS.
- **Component interactivity:** Many components (dropdowns, modals, drawers) need JavaScript for open/close behavior, focus trap, keyboard navigation, scroll lock. These must be `'use client'` components. Don't try to make them Server Components.
- **Accessibility:** The HTML reference files may not have complete ARIA attributes. Add proper `role`, `aria-*`, `tabIndex`, keyboard handlers to all interactive components.
- **Animation easing:** The design system defines custom easings (`ease-out-expo`, `ease-out-quint`). These need to be registered as Tailwind custom animations or used via inline styles.
- **Platform color badges (Instagram, Facebook, etc.):** These use hardcoded brand colors. Ensure they work in both dark and light mode.

---

## Cross-Cutting Concerns

### Middleware Architecture (Critical)
The middleware (`src/middleware.ts`) must compose three concerns:
1. **i18n routing** (next-intl) — locale detection, URL rewriting
2. **Auth protection** (better-auth) — session checking, redirects
3. **API exclusion** — `/api/*` routes bypass i18n

Order of operations:
```
Request → Is /api/*? → Pass through (no i18n, handle auth separately)
        → Is static? → Pass through
        → Apply i18n middleware (detect/rewrite locale)
        → Is protected route? → Check session → Redirect if unauthenticated
        → Continue to page
```

### Environment Variables
```env
# Database (Task 1.2)
DATABASE_URL=postgresql://...

# Auth (Task 1.3)
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Encryption (Task 1.2 - for social account tokens)
ENCRYPTION_KEY=... # 32-byte hex key for AES-256-GCM
```

### TypeScript Path Aliases
In `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/db/*": ["./src/db/*"],
      "@/i18n/*": ["./src/i18n/*"]
    }
  }
}
```

---

## Risk Register

### 🔴 High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Middleware collision** (next-intl + better-auth) | Auth breaks or locale routing fails | Implement single composed middleware early. Test all combinations: auth page + locale, protected page + locale, API route. |
| **Tailwind v4 paradigm unfamiliarity** | Agents create deprecated v3 configs, waste time debugging | Document v4 approach clearly. No `tailwind.config.js`. Use `@import "tailwindcss"` + `@theme`. |
| **Better-auth schema conflicts with app schema** | Table name mismatches, migration failures | Use Better-auth CLI to generate initial schema, then manually merge with app tables. Use singular naming for auth tables. |
| **Neon PostgreSQL cold start latency** | First load after idle is slow (500ms+) | Use connection pooling. Accept dev-mode latency. Only impacts free-tier Neon. |

### 🟡 Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **11 locale files maintenance** | Translation files get out of sync | Use English as source of truth. Stub files for non-English. Add CI check for missing keys. |
| **Font availability** (Instrument Serif) | Font not in next/font/google registry | Check availability upfront. Prepare fallback font or self-host. |
| **Design system visual fidelity** | React components don't match HTML reference | Build a component showcase page. Do side-by-side visual comparison. |
| **Drizzle ORM learning curve** | Agents unfamiliar with Drizzle syntax | Drizzle is SQL-like, which helps. Provide example queries in schema comments. |

### 🟢 Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Package version conflicts** | Dependency resolution fails | All packages confirmed compatible. Pin exact versions. |
| **Git merge conflicts** | Multiple agents editing same files | Use `.worktrees` for parallel work. Clear task ownership. |

---

## Verification Checklist

After Phase 1 is complete, ALL of these must pass:

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` succeeds with zero errors
- [ ] `npm run lint` passes
- [ ] `npm run format:check` passes
- [ ] Landing page renders at `localhost:3000`
- [ ] Locale switching works: `/en`, `/zu`, `/af` all load
- [ ] Database connection verified: Drizzle Studio shows all tables in Neon
- [ ] Sign up with email/password works via Better-auth
- [ ] Sign in with Google OAuth works (if credentials configured)
- [ ] Protected route `/dashboard` redirects to `/login` when unauthenticated
- [ ] Protected route `/dashboard` loads when authenticated
- [ ] Dark/light mode toggle works and persists across page navigation
- [ ] All P0 design system components render correctly in both themes
- [ ] Side-by-side comparison with HTML reference files shows visual match
- [ ] TypeScript: zero type errors
- [ ] No console errors in browser

---

## Open Questions (Non-Blocking)

1. **OAuth credentials for dev environment:** Google and GitHub OAuth apps need to be created. Agents should use placeholder values until real credentials are provided. Better-auth works with email/password without OAuth configured.

2. **Neon database provisioning:** Who creates the Neon project? The implementing agent should create a free-tier Neon project and document the connection string setup. Connection string goes in `.env.local` (never committed).

3. **Instrument Serif font:** If not available via `next/font/google`, should we self-host or use an alternative? **Safest assumption:** Check Google Fonts first, fall back to self-hosting.

4. **Design system component doc page:** Should this be behind a route guard (dev-only) or public? **Assumption:** Route it under `/(dev)/` route group, excluded from production builds via environment check.
