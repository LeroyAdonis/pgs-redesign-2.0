# Purple Glow Social 2.0 — Platform Design Document

**Date:** 2026-02-27
**Status:** Approved
**Author:** Design Session (Brainstorming Skill)

---

## 1. Overview

Purple Glow Social 2.0 is an AI-powered social media management platform built specifically for South African businesses. It enables small businesses and SMEs to generate, schedule, and publish culturally-relevant social media content across all major platforms — in any of South Africa's 11 official languages.

### Core Value Proposition
- **AI-generated content** with SA cultural awareness (slang, hashtags, local references)
- **Brand voice learning** — AI scrapes linked accounts and learns your tone
- **Autonomous posting** — set it and forget it, or stay in the loop
- **Credit-based billing** — only pay for successfully published posts
- **Multi-language** — full platform and content in all 11 SA languages

---

## 2. Target Customers

- **Small businesses & entrepreneurs** (1-5 employees, solopreneurs, side hustlers)
- **SMEs** (5-50 employees, established businesses)
- Both served via differentiated pricing tiers

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 + React 19 + TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Auth** | Better-auth (social OAuth for platform linking) |
| **Database** | Neon PostgreSQL + Drizzle ORM |
| **AI Engine** | Puter.js (client-side text, image, video generation) |
| **Background Jobs** | Inngest (event-driven scheduled posting) |
| **Payments** | Polar.sh (subscriptions + usage billing) |
| **Deployment** | Vercel |
| **i18n** | next-intl (11 SA languages) |

---

## 4. Tier Structure & Pricing

| Feature | **Seedling** (Free Trial) | **Hustler** (R299/mo) | **Grower** (R799/mo) | **Mogul** (R1,999/mo) |
|---------|--------------------------|----------------------|---------------------|----------------------|
| Social accounts | 2 | 5 | 15 | Unlimited |
| AI posts/month | 10 credits | 50 credits | 200 credits | 500 credits |
| Platforms | IG + FB only | All platforms | All platforms | All + WhatsApp Biz |
| Scheduling | Manual only | Manual + AI weekly | AI daily + weekly | Full autonomous |
| Brand voice analysis | Basic | Full | Full + competitor | Full + multi-brand |
| Languages | English + 1 | English + 3 | All 11 languages | All 11 + custom |
| Image generation | ❌ | 10/month | 50/month | 200/month |
| Video generation | ❌ | 5 short clips/mo | 20 clips/mo | 50 clips + Reels/TikTok |
| Analytics | Basic | Standard | Advanced | Advanced + export |
| Calendar view | ✅ | ✅ | ✅ | ✅ |
| Admin/team seats | 1 | 2 | 5 | Unlimited |
| Support | Community | Email | Priority | Dedicated |

---

## 5. Supported Social Platforms

- Instagram (Graph API)
- Facebook Pages (Pages API)
- Twitter/X (API v2)
- LinkedIn (Marketing API)
- TikTok (Business API)
- WhatsApp Business (Cloud API)
- Google Business Profile (Business Profile API)

---

## 6. Credit System

- **1 credit = 1 successfully posted piece of content**
- Credits only deducted when `status = 'published'`
- Failed posts → auto-retry (3 attempts) → no credit charge
- Unused credits roll over for 1 month (Grower/Mogul only)
- Low credit warning at 10% remaining
- Top-up available via Polar.sh

### Post Status Flow
```
draft → scheduled → publishing → published ✅ (credit deducted)
                                → failed ❌ (no credit, retry/notify)
```

---

## 7. South African Localization

### 11 Official Languages
| Code | Language |
|------|----------|
| `en` | English |
| `af` | Afrikaans |
| `zu` | isiZulu |
| `xh` | isiXhosa |
| `nso` | Sepedi |
| `tn` | Setswana |
| `st` | Sesotho |
| `ts` | Xitsonga |
| `ss` | siSwati |
| `ve` | Tshivenḓa |
| `nr` | isiNdebele |

### Implementation
1. **UI Translation** — Entire dashboard toggleable via language selector using `next-intl`. Routes: `/en/dashboard`, `/zu/dashboard`, etc.
2. **AI Post Generation** — Content generated in selected target language(s) with culturally-appropriate slang, expressions, and hashtags
3. **SA Cultural Layer** — Injects `#Mzansi`, `#LocalIsLekker`, `#ProudlySA`, township references, local holidays (Heritage Day, Youth Day), city-specific references
4. **Brand Voice Per Language** — Different tone settings per language (formal English vs casual isiZulu)
5. **Toggle On/Off** — Users enable only languages they need, independently for UI and content

---

## 8. Core Data Model

```
Users
  └── Organizations (business profiles)
      ├── SocialAccounts (linked IG, FB, X, LinkedIn, TikTok, WhatsApp, Google)
      ├── BrandProfiles (tone, voice, colors, hashtags per account/language)
      ├── Posts (generated content + status tracking)
      │   ├── PostMedia (images, videos, attachments)
      │   └── PostSchedules (when/where to publish)
      ├── Credits (balance, transactions, deductions)
      ├── Analytics (engagement, reach, feedback loop)
      ├── CalendarEvents (scheduled view)
      └── Notifications (user + admin alerts)
  └── Subscriptions (tier, billing via Polar.sh)

Admin
  ├── ClientOverview (all orgs, stats)
  ├── SystemHealth (job status, failure rates)
  └── RevenueMetrics (subscriptions, credit usage)
```

---

## 9. Key Flows

### 9.1 Onboarding
Signup → Select tier → Link social accounts → AI scrapes brand → Generate first posts → Interactive tutorial

### 9.2 Content Generation
User requests posts → Puter.js generates text + images + video → User reviews/edits → Schedule or auto-post

### 9.3 Publishing (Inngest)
Cron runs every 5 minutes → Query scheduled posts → Publish to platform APIs → Success: deduct credit + log analytics → Failure: retry 3x, notify user

### 9.4 AI Learning Loop
User rates posts (👍/👎/edit) → Feedback updates brand profile weights → AI generates better content over time

---

## 10. Account Linking & Brand Scraping

### OAuth Linking
Each platform linked via OAuth. Access tokens stored encrypted in `SocialAccounts`.

### Auto-Scrape on Link
When an account is linked, AI crawls public posts to extract:
- Tone fingerprint (formal/casual/humorous)
- Vocabulary clusters (industry-specific words)
- Hashtag patterns & frequency
- Posting cadence & best times
- Emoji usage patterns
- Average content length
- Visual style (colors, image types)

Results stored in `BrandProfiles` — user can review and adjust.

---

## 11. Scheduling & Calendar

- **Calendar View** — Full month/week/day view of all scheduled posts
- **Scheduled Posts Page** — List view with filters (platform, status, date range)
- **Drag & drop** rescheduling
- **Bulk scheduling** — AI generates week/month of content at once
- **Autonomous mode** — AI schedules at optimal times based on analytics

---

## 12. Notification System

### User Notifications
- ✅ Post published successfully
- ❌ Post failed (with retry option)
- ⚠️ Low credits warning (10% remaining)
- 📊 Weekly analytics summary
- 🔗 Social account token expiring/expired
- 📅 Upcoming scheduled posts reminder

### Admin Notifications
- 🚨 System-wide posting failures spike
- 👤 New user signup
- 💳 Subscription changes (upgrades/downgrades/cancellations)
- ⚠️ API rate limit warnings per platform

### Delivery
In-app notification bell + email digest (configurable frequency)

---

## 13. Analytics

### User Analytics Dashboard
- Engagement metrics per post (likes, shares, comments, reach)
- Platform comparison — which platform performs best
- Best posting times — AI-derived optimal schedule
- Content performance — which types of posts work best
- Credit usage — spent vs remaining, burn rate
- AI improvement score — how feedback is improving content

### Admin Dashboard
| Section | Content |
|---------|---------|
| Client Overview | All businesses, signup date, tier, active/inactive |
| Account Linking | Accounts linked, platforms, connection health |
| Revenue | MRR, tier distribution, churn rate, credit purchases |
| System Health | Inngest job status, API failures, queue depth |
| Content Stats | Total posts generated, published, failed |
| User Activity | Active users, last login, platform engagement |

---

## 14. Application Routes

### Public Pages
```
/                       → Landing page
/pricing                → Tier comparison + signup CTA
/features               → Platform features showcase
/about                  → About Purple Glow Social
/blog                   → SA social media tips & insights
/[lang]/...             → All pages in 11 languages
```

### Auth
```
/login                  → Email + social OAuth login
/signup                 → Registration + tier selection
/onboarding             → Link accounts + brand scan wizard
```

### User Dashboard
```
/dashboard              → Overview (credits, recent posts, quick stats)
/dashboard/accounts     → Linked social accounts
/dashboard/generate     → AI Content Studio (text + images + video)
/dashboard/posts        → All posts (drafts, scheduled, published, failed)
/dashboard/calendar     → Calendar view of scheduled posts
/dashboard/analytics    → Performance metrics & insights
/dashboard/brand        → Brand profile settings
/dashboard/billing      → Subscription, credits, invoices
/dashboard/settings     → Profile, notifications, language preferences
/dashboard/team         → Team members (Grower/Mogul tiers)
```

### Admin Dashboard
```
/admin                  → System overview & key metrics
/admin/clients          → All businesses/organizations
/admin/accounts         → All linked social accounts
/admin/posts            → System-wide post status & moderation
/admin/jobs             → Inngest job monitoring
/admin/revenue          → Subscription & credit revenue
/admin/system           → API health, rate limits, error logs
/admin/notifications    → System notification management
```

### Documentation & Legal
```
/docs                   → Customer-facing documentation hub
/docs/getting-started   → First-time user tutorial
/docs/linking-accounts  → How to link social accounts
/docs/ai-content        → How AI content generation works
/docs/scheduling        → Scheduling & calendar guide
/docs/billing           → Credits, tiers & billing FAQ
/docs/api               → API docs (Mogul tier)
/legal/privacy          → POPIA-compliant privacy policy
/legal/terms            → Terms of Service
/legal/cookies          → Cookie policy
/legal/paia             → PAIA manual (SA requirement)
/legal/acceptable-use   → Acceptable use policy
```

---

## 15. Chatbot (Puter.js)

- **Floating chat widget** on all pages (bottom-right corner)
- Powered by Puter.js client-side AI — zero server costs
- Answers platform questions, guides onboarding, troubleshoots issues
- Escalates to human support via email ticket
- SA-aware: responds in user's selected language with cultural context

---

## 16. First-Time User Tutorial

- Interactive step-by-step wizard on first login
- Steps: Welcome → Link first account → Brand scan → Generate first post → Schedule it → Done! 🎉
- Progress tracked, skippable but encouraged
- Replayable from `/docs/getting-started`

---

## 17. Architecture Decision: Monolithic Next.js App

Single Next.js 16 application with RSC for dashboard, Inngest for background jobs, Puter.js for client-side AI. Simpler deployment, shared auth, fastest path to MVP. Clear module boundaries maintained for future extraction if needed.
