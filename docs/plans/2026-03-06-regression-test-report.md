# Regression Test Report — Purple Glow Social 2.0

**Date:** 2026-03-06  
**Tested by:** Copilot Fleet (11 parallel agents)  
**Scope:** 35 pages, 24 API endpoints, 474 unit tests  
**Tools:** Vitest, TypeScript compiler, playwright-cli, ESLint

---

## Executive Summary

The platform's **security posture is strong** — all 17 protected routes properly redirect unauthenticated users. Unit tests (474/474) and TypeScript type checking pass clean. However, **5 critical regressions** were found: i18n is broken for all non-English locales, 3 docs pages crash with 500 errors, one API endpoint returns 500 instead of 401, and both production build and ESLint hang due to memory/performance issues.

---

## CI Health Checks

| Check | Status | Details |
|-------|--------|---------|
| TypeScript (`tsc --noEmit`) | ✅ **PASS** | Zero errors across entire codebase |
| Unit Tests (Vitest) | ✅ **474/474 PASS** | All suites green — analytics, inngest, publishers, subscriptions, credits, components, security, notifications, admin, landing, API routes |
| Production Build (`next build`) | 🔴 **BLOCKED** | Turbopack compiles successfully in 100s, but hangs indefinitely during integrated TypeScript checking phase (1.8GB RAM consumed) |
| ESLint (`npm run lint`) | 🔴 **BLOCKED** | Hangs on 462 TS/JS/JSX files — tried full scope, subset scoping, and JSON output — all timeout |

---

## Browser Testing Results (playwright-cli)

### Public / Landing Pages (3 tested)

| Page | URL | Status | Notes |
|------|-----|--------|-------|
| English Landing | `/en` | ✅ **PASS** | Full page renders: nav, hero ("Liquid Intelligence"), features, process, testimonials, pricing (R0/R299/R999), credits, contact form, footer, chatbot |
| Afrikaans Landing | `/af` | 🔴 **FAIL** | 500 Internal Server Error — blank page |
| Zulu Landing | `/zu` | 🔴 **FAIL** | 500 Internal Server Error — blank page |

**Root Cause:** Dynamic import in `src/i18n/request.ts` line ~25:
```typescript
messages: (await import(`./messages/${locale}.json`)).default
```
Template string prevents Turbopack from statically analyzing which locale files to bundle. Only `en.json` (default locale) gets bundled. All other 10 locales fail at runtime.

**Impact:** All 10 non-English South African languages are completely broken. This is a core platform feature (11 official SA languages).

---

### Authentication Pages (4 tested)

| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Login | `/en/login` | ✅ **PASS** | Dark theme, email/password fields, OAuth (Google, GitHub), validation works, "Invalid email or password" error shown correctly |
| Signup | `/en/signup` | ✅ **PASS** | Name/email/password fields, OAuth, accepts input — ⚠️ no post-signup feedback |
| Forgot Password | `/en/forgot-password` | ✅ **PASS** | Email field, green success card after submit, security best practice (no user enumeration) |
| Reset Password | `/en/reset-password` | ✅ **PASS** | New/confirm password fields, "Invalid or expired reset link" when no token, password mismatch validation |

**Design Consistency:** ✅ All auth pages share dark theme, purple brand logo, monospace labels, purple focus rings, skip-to-content link, chatbot widget.

**Issues:**
- ⚠️ **No post-signup feedback** — API returns 200 but user sees no confirmation or redirect
- 🟡 Chatbot auto-opens after form submits, overlapping content
- 🟡 No input placeholders for empty-state clarity

---

### Documentation Pages (7 tested)

| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Docs Index | `/en/docs` | ✅ **PASS** | Dark theme, sidebar nav, 6 topic cards, chatbot widget, breadcrumbs |
| Getting Started | `/en/docs/getting-started` | ✅ **PASS** | Full guide, TOC, interactive tutorial, 5-step setup |
| API Reference | `/en/docs/api-reference` | ✅ **PASS** | Complete API docs, code blocks, "Mogul tier" warning, TOC |
| Billing FAQ | `/en/docs/billing-faq` | ✅ **PASS** | Category filter pills, accordion Q&As, sidebar |
| Scheduling | `/en/docs/scheduling` | 🔴 **FAIL** | 500 — "Missing `<html>` and `<body>` tags in the root layout" |
| Linking Accounts | `/en/docs/linking-accounts` | 🔴 **FAIL** | 500 — Server-side rendering crash, connection forcibly closed |
| AI Content | `/en/docs/ai-content` | 🔴 **FAIL** | `net::ERR_ABORTED` — Server crashes mid-response, aborting connection |

**Sidebar navigation:** All 6 links present and correctly pointed.

---

### Legal Pages (6 tested)

| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Legal Index | `/en/legal` | ✅ **PASS** | 5 cards, intro text, breadcrumbs |
| Privacy Policy | `/en/legal/privacy` | ✅ **PASS** | 13 H2s, 30 paragraphs, 11 lists |
| Terms of Service | `/en/legal/terms` | ✅ **PASS** | 16 H2s, 34 paragraphs, 11 lists |
| Cookie Policy | `/en/legal/cookies` | ✅ **PASS** | 8 H2s, 20 paragraphs, data table |
| Acceptable Use | `/en/legal/acceptable-use` | ✅ **PASS** | 9 H2s, 24 paragraphs, 14 lists |
| PAIA Manual | `/en/legal/paia` | ✅ **PASS** | 12 H2s, 39 paragraphs, 17 lists |

**Quality:** Exemplary — proper POPIA/PAIA compliance, accessibility landmarks, heading hierarchy, cross-linking, SA-specific legal references.

---

### Dashboard Pages (10 tested)

| Route | Auth Redirect | Callback URL | Console Errors | Security |
|-------|:---:|:---:|---|:---:|
| `/en/dashboard` | ✅ 307 | ✅ Preserved | None | ✅ |
| `/en/dashboard/posts` | ✅ 307 | ✅ Preserved | None | ✅ |
| `/en/dashboard/accounts` | ✅ 307 | ✅ Preserved | None | ✅ |
| `/en/dashboard/brand` | ✅ 307 | ✅ Preserved | None | ✅ |
| `/en/dashboard/calendar` | ✅ 307 | ✅ Preserved | None | ✅ |
| `/en/dashboard/analytics` | ✅ 307 | ✅ Preserved | None | ✅ |
| `/en/dashboard/generate` | ✅ 307 | ✅ Preserved | None | ✅ |
| `/en/dashboard/team` | ✅ 307 | ✅ Preserved | None | ✅ |
| `/en/dashboard/billing` | ✅ 307 | ✅ Preserved | None | ✅ |
| `/en/dashboard/settings` | ✅ 307 | ✅ Preserved | None | ✅ |

**Verdict:** All 10 routes properly guarded by `requireServerSession()`. Zero content leakage. Callback URLs preserved for post-login redirect.

---

### Admin Pages (7 tested)

| Route | Auth Redirect | Console Errors | Security |
|-------|:---:|---|:---:|
| `/en/admin` | ✅ 307 | None | ✅ |
| `/en/admin/accounts` | ✅ 307 | favicon 404 | ✅ |
| `/en/admin/clients` | ✅ 307 | favicon 404 | ✅ |
| `/en/admin/posts` | ✅ 307 | None | ✅ |
| `/en/admin/jobs` | ✅ 307 | favicon 404 | ✅ |
| `/en/admin/system` | ✅ 307 | favicon 404 | ✅ |
| `/en/admin/revenue` | ✅ 307 | favicon 404 | ✅ |

**Verdict:** All 7 routes guarded by `requireAdminSession()`. Zero content leakage. All redirects use `callbackUrl=%2Fadmin` (does not preserve sub-path — minor UX issue).

---

## API Health Check (24 endpoints)

### Healthy (1)
| Endpoint | Status | Response |
|----------|--------|----------|
| `/api/inngest` | **200** ✅ | JSON — Inngest introspection |

### Properly Auth-Protected (21)
All return `401` with `{"success":false,"error":"Unauthorized"}` — proper JSON, no HTML error pages.

- **Analytics (5):** `/api/analytics/overview`, `/platforms`, `/trends`, `/best-times`, `/posts`
- **Admin (7):** `/api/admin/system`, `/stats`, `/jobs`, `/revenue`, `/posts`, `/clients`, `/accounts`
- **Credits (2):** `/api/credits/balance`, `/transactions`
- **Subscriptions (1):** `/api/subscriptions/current`
- **Schedule (2):** `/api/schedule`, `/optimal-times`
- **AI (1):** `/api/ai/feedback/stats`
- **Posts (1):** `/api/posts`
- **Notifications (2):** `/api/notifications`, `/count`

### Issues (2)

| Endpoint | Status | Issue |
|----------|--------|-------|
| `/api/social/accounts` | **500** 🔴 | `requireServerSession()` throws `NEXT_REDIRECT` which is caught by generic `catch(error)` block — returns `{"error":"Failed to list accounts"}` instead of 401 |
| `/api/auth/session` | **404** 🟡 | Not a real bug — Better-auth uses `/api/auth/get-session`, not `/session` |

### Security Notes
- ✅ All 22 protected endpoints reject unauthenticated requests
- ✅ All endpoints return `application/json` (no HTML error pages)
- ⚠️ Inconsistent error format: 20 endpoints use `{"success":false,"error":"..."}`, but notifications use `{"error":"..."}`

---

## Issue Summary

### 🔴 Critical (5)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| C1 | **i18n broken for all non-English locales** | `src/i18n/request.ts` ~L25 | All 10 non-default SA languages return 500 |
| C2 | **3 docs pages return 500** | `/docs/scheduling`, `/docs/linking-accounts`, `/docs/ai-content` | Missing layout tags / SSR crash |
| C3 | **`/api/social/accounts` returns 500** | API route handler | Catches NEXT_REDIRECT as generic error instead of returning 401 |
| C4 | **Production build hangs** | `next build` TS check phase | 1.8GB RAM, never completes — blocks CI/CD |
| C5 | **ESLint hangs** | `npm run lint` on 462 files | Never completes — blocks CI/CD |

### ⚠️ Medium (3)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| M1 | **No post-signup feedback** | Signup page | User sees nothing after successful registration |
| M2 | **Admin callback URL loses sub-path** | Admin layout redirect | User lands on `/admin` instead of specific sub-page after login |
| M3 | **Inconsistent API error format** | Notification endpoints | `{"error":"..."}` vs `{"success":false,"error":"..."}` |

### 🟡 Minor (2)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| L1 | **Missing favicon.ico** | Root public assets | 404 on every page load |
| L2 | **Chatbot auto-opens after form submit** | Chat widget | Overlaps form content |

---

## Strengths

- **Security posture: Excellent** — 17/17 protected routes properly guarded, zero content leakage
- **Unit test coverage: Solid** — 474 tests all passing
- **TypeScript: Clean** — zero type errors
- **Legal pages: Exemplary** — comprehensive POPIA/PAIA/CPA compliance
- **Auth UX: Polished** — proper validation, error messages, security best practices
- **API design: Consistent** — 21/24 endpoints return proper JSON 401 responses
- **Design system: Cohesive** — dark theme, purple brand, monospace labels, accessibility features

---

## Previous Plan Relevance

| Plan Document | Status | Still Relevant? |
|---------------|--------|-----------------|
| Implementation Plan (14 phases) | All marked ✅ | Yes — but testing reveals regressions that need fixing |
| Orchestrated Audit (2026-02-20) | Framework approved | **Yes** — ideal playbook for fixing the 5 critical issues |
| Chatbot Support (2026-03-03) | Phase 12 complete | Chatbot widget is live and working |
| Phase 1 Foundation | Complete | Reference-only |
| Kanban Orchestration (2026-02-24) | Design approved | Conditional — for future multi-agent work |
| Persistent Kanban (2026-02-25) | Design approved | Conditional — depends on Kanban orchestration |
