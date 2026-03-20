# PGS 2.0 MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship Purple Glow Social 2.0 MVP — all critical flows working, no placeholder pages, AI generation live, analytics data flowing, settings functional.

**Architecture:** Next.js 16 App Router with [locale] i18n, Better Auth, Drizzle ORM on Neon PostgreSQL, OpenRouter AI, Polar.sh billing.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, Drizzle ORM, Better Auth, OpenRouter, Resend, Vercel

---

## PHASE A — Verification & Re-test (No dependencies, run FIRST)

### Task A1: Re-run full E2E test suite to confirm previous fixes
**Goal:** Confirm org auto-creation, CSP fix, and API route fixes all work in production.

**Steps:**
1. Install playwright: `pip install playwright && playwright install chromium`
2. Write /tmp/test_recheck.py:
```python
from playwright.sync_api import sync_playwright
import time

BASE = "https://pgs-redesign-20.vercel.app"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # Test 1: Signup page loads
    page.goto(f"{BASE}/signup")
    page.wait_for_load_state("networkidle")
    title = page.title()
    print(f"SIGNUP PAGE: {page.url} | title={title}")
    page.screenshot(path="/tmp/recheck_signup.png")
    
    # Test 2: Sign up a new user
    import uuid
    email = f"test-{uuid.uuid4().hex[:8]}@mailinator.com"
    page.goto(f"{BASE}/signup")
    page.wait_for_load_state("networkidle")
    # fill form
    inputs = page.locator("input").all()
    print(f"Inputs found: {len(inputs)}")
    for inp in inputs:
        t = inp.get_attribute("type") or ""
        n = inp.get_attribute("name") or inp.get_attribute("placeholder") or ""
        print(f"  input type={t} name/placeholder={n}")
    
    browser.close()
```
3. Run: `python3 /tmp/test_recheck.py`
4. Report: signup page URL, form inputs found, any errors

---

## PHASE B — Settings Page (depends on: A1 passing)

### Task B1: Build Settings Page — Profile Tab
**Files:**
- Modify: `src/app/[locale]/(dashboard)/dashboard/settings/page.tsx`
- Create: `src/app/[locale]/(dashboard)/dashboard/settings/_components/profile-form.tsx`
- Create: `src/app/api/user/profile/route.ts`

**What to build:**
Replace the "Coming Soon" placeholder with a real settings page with tabs:
1. **Profile tab** — edit display name, email (read-only), avatar upload placeholder
2. **Notifications tab** — toggle email notifications on/off (store in org settings or user table)
3. **Security tab** — change password form (uses Better Auth's `changePassword` method)

**Profile API route** (`/api/user/profile`):
- GET: returns `{ name, email, image, createdAt }` from session
- PATCH: updates `name` field in `user` table using `db.update(user).set({ name }).where(eq(user.id, session.user.id))`

**Profile form component:**
```tsx
"use client"
import { useState } from "react"

export function ProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    })
    setSaving(false)
    if (res.ok) setSaved(true)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-text">Display Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-text">Email</label>
        <input value={email} disabled className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-muted opacity-60" />
      </div>
      <button onClick={handleSave} disabled={saving} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
        {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
      </button>
    </div>
  )
}
```

**Settings page structure:**
```tsx
// Tabs: Profile | Notifications | Security
// Each tab is a separate client component
// Use shadcn Tabs or simple tab state
```

**Steps:**
1. Create `/api/user/profile/route.ts` with GET and PATCH handlers
2. Create `_components/profile-form.tsx`
3. Create `_components/notifications-form.tsx` (simple toggles, store in localStorage for MVP)
4. Create `_components/security-form.tsx` (change password using `authClient.changePassword`)
5. Replace settings/page.tsx to render tabbed layout with all 3 components
6. Test: navigate to /dashboard/settings — profile form shows, save works

---

### Task B2: Build Team Page — Invite & Member List
**Files:**
- Modify: `src/app/[locale]/(dashboard)/dashboard/team/page.tsx`
- Create: `src/app/[locale]/(dashboard)/dashboard/team/_components/invite-form.tsx`
- Create: `src/app/[locale]/(dashboard)/dashboard/team/_components/members-list.tsx`
- Create: `src/app/api/team/route.ts`

**What to build for MVP:**
1. List current org members (query `organizationMember` joined with `user`)
2. Invite by email — send an email via Resend with a magic link or placeholder invite
3. Show member roles (owner, admin, member)

**Team API** (`/api/team`):
- GET: returns list of org members with name, email, role, joinedAt
```ts
const members = await db
  .select({ id: user.id, name: user.name, email: user.email, role: organizationMember.role, joinedAt: organizationMember.createdAt })
  .from(organizationMember)
  .innerJoin(user, eq(user.id, organizationMember.userId))
  .where(eq(organizationMember.organizationId, membership.organizationId))
```
- POST: invite member — for MVP, just add them to org if they already have an account, or store invite email

**Steps:**
1. Create `/api/team/route.ts` with GET (list members) and POST (invite)
2. Create `_components/members-list.tsx` — table of members with role badges
3. Create `_components/invite-form.tsx` — email input + invite button
4. Replace team/page.tsx with real implementation
5. Test: page loads, own user appears as owner, invite form renders

---

## PHASE C — Fix Tutorial Overlay UX Bug (No dependencies)

### Task C1: Fix tutorial overlay blocking generate button
**File:** `src/components/tutorial/TutorialOverlay.tsx`

**Problem:** The tutorial overlay intercepts pointer events on the Generate button on first visit.

**Steps:**
1. Read the TutorialOverlay component: `cat src/components/tutorial/TutorialOverlay.tsx`
2. Find where `pointer-events-none` or the overlay z-index is set
3. Fix: either make the overlay dismissible with a click-outside, or ensure the "Skip" button is always accessible and not covered
4. Also check: does the overlay re-appear every visit or only on first? Should be localStorage-gated.
5. If not localStorage-gated, add: `if (localStorage.getItem('tutorial-done')) return null`
6. Test: visit /dashboard/generate — generate button should be clickable without dismissing overlay first

---

## PHASE D — Analytics Real Data (depends on: A1 passing)

### Task D1: Wire analytics API to return real data from DB
**Files:**
- Modify: `src/app/api/analytics/overview/route.ts`
- Modify: `src/app/api/analytics/trends/route.ts`
- Check: `src/app/api/analytics/_lib/utils.ts`

**Problem:** Analytics APIs return empty data because the `analytic` table is likely empty for new users. Instead of showing nothing, show derived stats from `post` and `postSchedule` tables.

**Steps:**
1. Read: `cat src/app/api/analytics/overview/route.ts`
2. Read: `cat src/db/schema.ts | grep -A 20 "analytic ="`
3. Modify overview route to also query posts count, scheduled count, connected accounts count as fallback metrics
4. If `analytic` table is empty, derive from posts: total posts, drafts vs published, platform breakdown
5. Ensure response always returns valid shape even with zero data
6. Test: hit `/api/analytics/overview` as authenticated user — should return 200 with data object

---

## PHASE E — AI Generation Verification & Fix (depends on: Phase A)

### Task E1: Verify AI generation works after CSP fix
**Steps:**
1. Write a test script that calls `/api/ai/generate` directly with a valid session cookie
2. If still 500, read the full error from Vercel logs or add console.error logging
3. Check: is OPENROUTER_API_KEY set? `vercel env ls --token ... | grep OPENROUTER`
4. Check: does the openrouter-client handle the `hunter-alpha` model correctly?
5. Read: `cat src/lib/ai/openrouter-client.ts` — check model names match OpenRouter's actual model IDs
6. Common fix: `openrouter/hunter-alpha` may need to be `anthropic/claude-3-haiku` or similar valid ID
7. Test with curl:
```bash
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openrouter/auto","messages":[{"role":"user","content":"Say hello"}]}'
```
8. If model IDs are wrong, update FALLBACK_MODELS in openrouter-client.ts to use valid IDs
9. Deploy and retest

---

## PHASE F — Final QA & Deploy (depends on: B, C, D, E)

### Task F1: Full regression E2E test
Write comprehensive Playwright test hitting every route:
1. Landing page loads
2. Sign-up creates account + org
3. Sign-in works
4. Dashboard loads with real data
5. Generate page — AI generation works
6. Posts page — no API errors
7. Analytics page — shows data (even empty state, not error)
8. Calendar page — loads
9. Settings page — profile form works
10. Team page — members list loads
11. No console errors on any page

### Task F2: Final Vercel deployment
```bash
cd ~/pgs-redesign-2.0 && VERCEL_TOKEN=__VERCEL_TOKEN_REDACTED__ vercel --prod --yes --token __VERCEL_TOKEN_REDACTED__ 2>&1
```

---

## PARALLEL EXECUTION MAP

```
Phase A (re-test)        ─── runs first, unblocks B+D+E
Phase B (Settings+Team)  ─── parallel with C, D, E
Phase C (Tutorial fix)   ─── parallel with B, D, E  
Phase D (Analytics)      ─── parallel with B, C, E
Phase E (AI verify/fix)  ─── parallel with B, C, D
Phase F (QA + Deploy)    ─── runs LAST, after all above complete
```

