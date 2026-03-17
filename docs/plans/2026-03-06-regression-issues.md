# Issue Tracker — Regression Test Findings (2026-03-06)

This document lists all issues found during the comprehensive regression test run on 2026-03-06. Use this as input for the implementation plan.

---

## Critical Issues

### C1: i18n Broken for All Non-English Locales

- **Severity:** 🔴 Critical
- **Status:** Open
- **Affected:** All 10 non-default locales (af, zu, xh, nso, tn, st, ts, ss, ve, nr)
- **Symptom:** Navigating to `/af`, `/zu`, etc. returns 500 Internal Server Error (blank page)
- **Root Cause:** Dynamic import in `src/i18n/request.ts` ~line 25:
  ```typescript
  messages: (await import(`./messages/${locale}.json`)).default
  ```
  Template string prevents Turbopack from statically analyzing which locale files to bundle. Only `en.json` (the default) gets included. Runtime imports of other locales fail.
- **Fix Direction:** Use a static lookup map or `require()` with explicit paths so all locale files are bundled. Alternatively, use next-intl's recommended async message loading pattern.
- **Files to Investigate:**
  - `src/i18n/request.ts`
  - `src/i18n/messages/*.json` (all 11 files exist)
  - `next.config.ts` (i18n config)
- **Test:** Navigate to `/af` and `/zu` — should render translated landing page

---

### C2: Three Docs Pages Return 500

- **Severity:** 🔴 Critical
- **Status:** Open
- **Affected Pages:**
  1. `/en/docs/scheduling` — Error: "Missing `<html>` and `<body>` tags in the root layout"
  2. `/en/docs/linking-accounts` — Server-side rendering crash, connection forcibly closed
  3. `/en/docs/ai-content` — `net::ERR_ABORTED`, server crashes mid-response
- **Working Pages:** `/en/docs` (index), `/en/docs/getting-started`, `/en/docs/api-reference`, `/en/docs/billing-faq`
- **Root Cause Hypothesis:** Layout configuration issue in these specific route segments. The "Missing HTML/body" error suggests a nested layout that doesn't properly inherit from the root layout, or a server component that throws during rendering.
- **Files to Investigate:**
  - `src/app/[locale]/(docs)/docs/scheduling/page.tsx`
  - `src/app/[locale]/(docs)/docs/linking-accounts/page.tsx`
  - `src/app/[locale]/(docs)/docs/ai-content/page.tsx`
  - `src/app/[locale]/(docs)/docs/layout.tsx` (if exists)
  - `src/app/[locale]/layout.tsx` (root layout)
- **Test:** Navigate to each page — should render docs content with sidebar

---

### C3: `/api/social/accounts` Returns 500 Instead of 401

- **Severity:** 🔴 Critical
- **Status:** Open
- **Symptom:** Unauthenticated GET to `/api/social/accounts` returns `{"error":"Failed to list accounts"}` with HTTP 500
- **Expected:** HTTP 401 with `{"success":false,"error":"Unauthorized"}` (consistent with other 21 protected endpoints)
- **Root Cause:** Route handler uses `requireServerSession()` which calls `redirect("/login")` when unauthenticated. This throws a `NEXT_REDIRECT` error. The route's generic `catch(error)` block catches this redirect exception and returns 500 instead of letting it propagate or doing an explicit auth check.
- **Fix Direction:** Replace `requireServerSession()` with `getServerSession()` + explicit null-check returning 401, consistent with the other protected API routes.
- **Files to Investigate:**
  - `src/app/api/social/accounts/route.ts`
  - `src/lib/auth-session.ts` (for `getServerSession` vs `requireServerSession`)
- **Test:** `curl http://localhost:3000/api/social/accounts` should return 401 JSON

---

### C4: Production Build Hangs During TypeScript Checking

- **Severity:** 🔴 Critical
- **Status:** Open
- **Symptom:** `npm run build` (`next build`) compiles successfully with Turbopack in ~100s, then hangs indefinitely during "Running TypeScript..." phase consuming 1.8GB RAM
- **Note:** Standalone `npx tsc --noEmit` completes successfully with zero errors, so this is specific to `next build`'s integrated TS checking.
- **Root Cause Hypothesis:**
  - Next.js 16's integrated TS checking may have different behavior than standalone tsc
  - Possible circular type references that tsc handles but next build doesn't
  - Memory pressure from Turbopack compilation + TS checking running in same process
- **Fix Direction:**
  - Option A: Add `typescript: { ignoreBuildErrors: true }` to `next.config.ts` and rely on standalone `tsc --noEmit` in CI (pragmatic)
  - Option B: Investigate which specific types cause the hang (thorough)
  - Option C: Increase Node.js heap size via `NODE_OPTIONS=--max-old-space-size=4096`
- **Files to Investigate:**
  - `next.config.ts`
  - `tsconfig.json`
  - Any complex type definitions in `src/`
- **Test:** `npm run build` should complete within 5 minutes

---

### C5: ESLint Hangs on Full Codebase

- **Severity:** 🔴 Critical
- **Status:** Open
- **Symptom:** `npm run lint` never completes — hangs after processing some files. Attempted `npx eslint .`, `npx eslint src/app`, and `npx eslint --format=json` — all hang.
- **Codebase:** 462 TypeScript/JavaScript/JSX files
- **Config:** ESLint 9.39.3 with `eslint.config.mjs` — includes Next.js, JSX-a11y (warnings), and Prettier plugins
- **Root Cause Hypothesis:**
  - A specific file or pattern may cause an ESLint rule to enter an infinite loop
  - Prettier integration can be slow on large files
  - Possible interaction between multiple plugins
- **Fix Direction:**
  - Run ESLint on individual directories to isolate the hanging file(s)
  - Profile with `TIMING=1 npx eslint .` to find slow rules
  - Consider running Prettier separately instead of as an ESLint plugin
- **Files to Investigate:**
  - `eslint.config.mjs`
  - Individual directories to isolate the problem
- **Test:** `npm run lint` should complete within 2 minutes

---

## Medium Issues

### M1: No Post-Signup Feedback

- **Severity:** ⚠️ Medium
- **Status:** Open
- **Symptom:** After filling signup form and submitting (API returns 200), user sees no visual feedback — no success message, no redirect to dashboard or onboarding
- **Expected:** Either redirect to `/onboarding` or show a success message / email verification prompt
- **Files to Investigate:**
  - `src/app/[locale]/(auth)/signup/page.tsx` (or client component)
  - Signup form submit handler
- **Test:** Submit valid signup form → should see feedback or redirect

---

### M2: Admin Callback URL Loses Sub-Path

- **Severity:** ⚠️ Medium
- **Status:** Open
- **Symptom:** Navigating to `/en/admin/clients` while unauthenticated redirects to `/en/login?callbackUrl=%2Fadmin` — the `/clients` sub-path is lost
- **Expected:** `callbackUrl=%2Fen%2Fadmin%2Fclients` so user returns to intended page after login
- **Files to Investigate:**
  - `src/app/[locale]/(admin)/admin/layout.tsx` (the `requireAdminSession()` redirect)
  - `src/lib/admin-session.ts`
- **Test:** Navigate to `/en/admin/clients` unauthenticated → callback URL should include full path

---

### M3: Inconsistent API Error Format

- **Severity:** ⚠️ Medium
- **Status:** Open
- **Symptom:** 20 API endpoints return `{"success":false,"error":"Unauthorized"}` but notification endpoints return `{"error":"Unauthorized"}` (missing `success` field)
- **Affected:** `/api/notifications`, `/api/notifications/count`
- **Files to Investigate:**
  - `src/app/api/notifications/route.ts`
  - `src/app/api/notifications/count/route.ts`
- **Fix:** Add `success: false` to error responses for consistency

---

## Minor Issues

### L1: Missing favicon.ico

- **Severity:** 🟡 Low
- **Status:** Open
- **Symptom:** `favicon.ico` returns 404 on every page load
- **Fix:** Add a `favicon.ico` to `public/` directory or configure in `src/app/layout.tsx` metadata
- **Files:** `public/favicon.ico` (missing), `src/app/layout.tsx`

---

### L2: Chatbot Auto-Opens After Form Submit

- **Severity:** 🟡 Low
- **Status:** Open
- **Symptom:** Purple Glow Assistant chatbot widget auto-opens after form submissions on auth pages, overlapping the form content
- **Files to Investigate:** Chatbot widget component (likely `src/components/chatbot/`)
- **Fix:** Suppress auto-open on auth pages or add a delay

---

## Summary Table

| ID | Issue | Severity | Category |
|----|-------|----------|----------|
| C1 | i18n broken for non-English locales | 🔴 Critical | i18n |
| C2 | 3 docs pages return 500 | 🔴 Critical | Docs/SSR |
| C3 | `/api/social/accounts` returns 500 | 🔴 Critical | API |
| C4 | Production build hangs | 🔴 Critical | Build/CI |
| C5 | ESLint hangs | 🔴 Critical | Build/CI |
| M1 | No post-signup feedback | ⚠️ Medium | Auth UX |
| M2 | Admin callback URL loses sub-path | ⚠️ Medium | Admin UX |
| M3 | Inconsistent API error format | ⚠️ Medium | API |
| L1 | Missing favicon.ico | 🟡 Low | Assets |
| L2 | Chatbot auto-opens after form submit | 🟡 Low | UX |
