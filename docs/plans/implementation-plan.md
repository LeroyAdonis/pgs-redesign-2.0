# Purple Glow Social 2.0 — Implementation Plan

> **⚠️ SESSION MANAGEMENT RULE:** Clear context and start a new session after each phase completes. Keep context 
> windows lean. At the start of each new session, read this plan and the design doc to understand current progress 
> and next steps. Use relevant skills to complete the tasks. Also, dispatch agents to use using-git-worktrees skill for all 
> new features and use dispatching-parallel-agents skill for all other tasks and systematic-debugging skill for 
> critical bugs. 

## Design Document
Full design: `docs/plans/2026-02-27-purple-glow-social-platform-design.md`

## Progress Tracking
After completing each phase, update the status below:

| Phase | Status | Completed By |
|-------|--------|-------------|
| Phase 1: Foundation | ✅ Complete | Copilot Fleet |
| Phase 2: Core UI | ✅ Complete | Copilot Fleet |
| Phase 3: Social Linking | ✅ Complete | Copilot Fleet |
| Phase 4: AI Engine | ⬜ Not Started | — |
| Phase 5: Scheduling | ⬜ Not Started | — |
| Phase 6: Posting Engine | ⬜ Not Started | — |
| Phase 7: Payments | ⬜ Not Started | — |
| Phase 8: Analytics | ⬜ Not Started | — |
| Phase 9: Notifications | ⬜ Not Started | — |
| Phase 10: Admin Dashboard | ⬜ Not Started | — |
| Phase 11: Docs & Legal | ⬜ Not Started | — |
| Phase 12: Chatbot | ⬜ Not Started | — |
| Phase 13: Testing & Polish | ⬜ Not Started | — |

---

## Phase 1: Foundation & Infrastructure

### 1.1 Next.js 16 project scaffolding
Initialize Next.js 16 + React 19 + TypeScript project with App Router, Tailwind CSS v4. Configure ESLint, Prettier. Folder structure:
```
src/
  app/           # App Router pages
  components/    # Shared React components
  lib/           # Utilities, helpers, constants
  db/            # Drizzle schema, migrations
  inngest/       # Inngest functions
  i18n/          # Translation files
```

### 1.2 Database schema & Drizzle ORM
Design and implement full Drizzle schema on Neon PostgreSQL:
- `users` — auth users
- `organizations` — business profiles
- `social_accounts` — linked platform accounts (encrypted tokens)
- `brand_profiles` — AI-extracted brand voice data
- `posts` — generated content with status tracking
- `post_media` — images, videos, attachments
- `post_schedules` — when/where to publish
- `credits` — balance per org
- `credit_transactions` — deductions, purchases, rollovers
- `analytics` — engagement metrics per post
- `notifications` — user + admin notifications
- `subscriptions` — tier, billing via Polar.sh

### 1.3 Better-auth setup
Configure Better-auth with email/password + social OAuth providers (Google, GitHub). Session management, protected routes, middleware for auth checks.

### 1.4 i18n setup (next-intl)
Configure next-intl with all 11 SA official languages:
- `en` English, `af` Afrikaans, `zu` isiZulu, `xh` isiXhosa, `nso` Sepedi
- `tn` Setswana, `st` Sesotho, `ts` Xitsonga, `ss` siSwati, `ve` Tshivenḓa, `nr` isiNdebele

Locale routing (`/[lang]/...`), language toggle component, translation JSON file structure.

### 1.5 Design system migration
Port existing design system (ds-*.html files) to React components with Tailwind CSS v4. Purple Glow theme tokens, dark/light mode toggle.

---

## Phase 2: Core User Features

### 2.1 Landing page
Convert index-v2.html to Next.js RSC page with SA localization, pricing section, feature showcase.

### 2.2 Auth pages
Login, signup, password reset pages with Better-auth integration.

### 2.3 Onboarding wizard
Multi-step wizard: Welcome → Select tier → Link first account → Brand scan → Generate first post → Schedule → Done! 🎉

### 2.4 User dashboard layout
Dashboard shell with sidebar navigation, header with credit display, notification bell, language toggle.

### 2.5 Dashboard overview page
Credits summary, recent posts widget, quick stats, upcoming scheduled posts.

---

## Phase 3: Social Account Linking & Brand Analysis

### 3.1 OAuth integration
Implement OAuth flows for: Instagram (Graph API), Facebook (Pages API), Twitter/X (API v2), LinkedIn (Marketing API), TikTok (Business API), WhatsApp Business (Cloud API), Google Business Profile (API). Encrypted token storage, refresh logic.

### 3.2 Account management UI
`/dashboard/accounts` page: list linked accounts, add/remove, connection health status, token expiry warnings.

### 3.3 Brand scraping engine
On account link: scrape public posts to extract tone fingerprint, vocabulary clusters, hashtag patterns, posting cadence, emoji usage, visual style. Store in `brand_profiles` table.

### 3.4 Brand profile UI
`/dashboard/brand` page: view/edit AI-extracted brand profile, tone sliders, hashtag preferences, per-language settings.

---

## Phase 4: AI Content Engine (Puter.js)

### 4.1 Puter.js integration
Set up Puter.js client-side SDK. Text generation with SA cultural layer (slang, hashtags, local references, language-specific content).

### 4.2 AI Content Studio UI
`/dashboard/generate` page: select platform(s), language, content type (text/image/video), generate, preview, edit, save as draft.

### 4.3 Image generation
Puter.js Nano Banana integration for social media image generation. Brand-aware (colors, style). Platform-specific dimensions (IG square, FB landscape, Stories portrait).

### 4.4 Video generation
Short-form video generation (15-30s clips). Reels/TikTok/Stories formats. Text animations, product showcases, brand promos.

### 4.5 SA cultural context layer
Hashtag injection (#Mzansi, #LocalIsLekker, #ProudlySA), township references, local holidays (Heritage Day, Youth Day, Freedom Day), city-specific content, language-appropriate slang.

### 4.6 AI feedback loop
👍/👎/edit rating system on generated content. Ratings update brand profile weights. Track AI improvement score over time.

---

## Phase 5: Scheduling & Calendar

### 5.1 Post scheduling system
Schedule posts to specific date/time + platform(s). Support manual and AI-suggested optimal times based on analytics.

### 5.2 Calendar view
`/dashboard/calendar` page: full month/week/day views, color-coded by platform, drag-and-drop rescheduling.

### 5.3 Scheduled posts page
`/dashboard/posts` page: list view with filters (platform, status, date range), bulk actions (approve, reschedule, delete).

### 5.4 Autonomous scheduling
AI generates weekly/monthly content batches and auto-schedules at optimal times. User can review in calendar. Toggle between manual (in-the-loop) and autonomous modes.

### 5.5 Bulk content generation
Generate a week or month of posts at once with AI, review all, schedule all in batch.

---

## Phase 6: Posting Engine & Credits (Inngest)

### 6.1 Inngest setup
Configure Inngest with Next.js. Define event types: `post.scheduled`, `post.publish`, `post.failed`, `post.retry`.

### 6.2 Posting job
Cron function running every 5 minutes. Query posts WHERE `scheduled_at <= NOW()` AND `status = 'scheduled'`. Publish to platform APIs. Handle success/failure.

### 6.3 Platform publishing adapters
Adapter pattern for each platform (Instagram, Facebook, X, LinkedIn, TikTok, WhatsApp, Google). Handles API specifics, rate limits, media uploads.

### 6.4 Credit deduction system
Deduct 1 credit on successful publish only. Transaction logging. Balance checks before scheduling (prevent over-scheduling).

### 6.5 Retry & failure handling
Auto-retry failed posts (3 attempts with exponential backoff). Mark as `failed` after exhaustion. Notify user with retry option.

### 6.6 Credit dashboard
Credit balance in header (always visible), transaction history page, usage graphs, low-credit warnings (10%), top-up via Polar.sh.

---

## Phase 7: Payments & Subscriptions (Polar.sh)

### 7.1 Polar.sh integration
Configure Polar.sh SDK. Define 4 subscription tiers:
- **Seedling** (Free Trial)
- **Hustler** (R299/mo)
- **Grower** (R799/mo)
- **Mogul** (R1,999/mo)

### 7.2 Subscription management
Signup flow with tier selection, upgrade/downgrade, cancellation. Webhook handling for payment events (payment_success, subscription_cancelled, etc.).

### 7.3 Billing page
`/dashboard/billing` page: current plan, next billing date, invoices, payment method, upgrade CTA.

### 7.4 Credit top-ups
Purchase additional credits via Polar.sh for burst needs beyond monthly allocation.

### 7.5 Tier enforcement
Middleware to check tier limits (max accounts, posts/month, features). Graceful upgrade prompts when limits reached.

---

## Phase 8: Analytics & Insights

### 8.1 Analytics data collection
After post publish: fetch engagement metrics from platform APIs (likes, shares, comments, reach, impressions). Store in `analytics` table.

### 8.2 Analytics dashboard
`/dashboard/analytics` page: engagement charts, platform comparison, best posting times, content performance analysis, AI improvement score.

### 8.3 Analytics Inngest jobs
Background jobs to periodically fetch updated engagement metrics for published posts (hourly for first 48h, then daily).

### 8.4 Weekly analytics digest
Automated email/notification with weekly performance summary. Top performing posts, engagement trends, recommendations.

---

## Phase 9: Notification System

### 9.1 Notification infrastructure
Notification model in DB, in-app notification bell component, mark read/unread, notification preferences per user.

### 9.2 User notifications
Post published ✅, post failed ❌, low credits ⚠️, token expiring 🔗, weekly summary 📊, scheduled reminders 📅.

### 9.3 Admin notifications
System-wide failures 🚨, new signups 👤, subscription changes 💳, rate limit warnings ⚠️.

### 9.4 Email notifications
Email digest system (configurable: immediate, daily, weekly). Templates in SA Purple Glow brand style.

---

## Phase 10: Admin Dashboard

### 10.1 Admin layout & auth
Admin role check, admin sidebar navigation, protected admin routes.

### 10.2 Client overview
`/admin/clients`: all businesses, signup date, tier, active/inactive, search/filter.

### 10.3 Account overview
`/admin/accounts`: all linked social accounts across clients, connection health, platform distribution.

### 10.4 Post moderation
`/admin/posts`: system-wide post status, bulk actions, content review/moderation.

### 10.5 Job monitoring
`/admin/jobs`: Inngest job dashboard — running/failed/queued jobs, retry controls.

### 10.6 Revenue dashboard
`/admin/revenue`: MRR, tier distribution, churn rate, credit purchases, revenue trends.

### 10.7 System health
`/admin/system`: API health per platform, rate limits, error logs, uptime.

---

## Phase 11: Documentation & Legal

### 11.1 Documentation site
`/docs` pages: getting started, linking accounts, AI content guide, scheduling guide, billing FAQ, API docs (Mogul tier).

### 11.2 Legal pages
POPIA-compliant privacy policy, Terms of Service, cookie policy, PAIA manual (SA requirement), acceptable use policy.

### 11.3 Interactive tutorial
First-time user wizard overlay, step-by-step with progress tracking, skippable but encouraged, replayable from `/docs/getting-started`.

---

## Phase 12: Chatbot & Support

### 12.1 Puter.js chatbot
Floating chat widget (bottom-right), client-side AI (zero server costs), answers platform questions, SA-language aware.

### 12.2 Onboarding guidance
Chatbot guides first-time users through account setup, linking, and first post generation.

### 12.3 Support escalation
Escalate to email ticket when chatbot cannot resolve. Capture conversation context for support agent.

---

## Phase 13: Testing & Polish

### 13.1 E2E tests
Playwright tests for critical flows: signup, onboarding, generate post, schedule, publish, credit deduction.

### 13.2 Integration tests
API route tests, Inngest job tests, credit system tests, OAuth flow tests.

### 13.3 Accessibility
WCAG 2.1 AA compliance, screen reader support, keyboard navigation, focus management.

### 13.4 Performance
Core Web Vitals optimization, image optimization (next/image), lazy loading, bundle analysis.

### 13.5 Security audit
POPIA compliance verification, token encryption check, rate limiting, input sanitization, XSS/CSRF protection.
