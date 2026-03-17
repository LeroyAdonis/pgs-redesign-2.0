---
name: admin-dashboard
description: Guide for building, extending, and maintaining admin dashboard pages in Purple Glow Social 2.0. Use when creating new admin sections, adding admin API routes, modifying admin components, or debugging admin auth/layout issues. Covers auth guard patterns, dark theme conventions, server→client data flow, API route protection, and test patterns.
---

# Admin Dashboard

The admin dashboard is the internal control panel for Purple Glow Social 2.0. It provides platform operators with real-time visibility into clients, social accounts, posts, background jobs, revenue, and system health.

All admin routes live under `/admin` and require the `admin` role. The dashboard uses a dark slate theme, server-first data loading, and consistent component patterns.

## Architecture

### Route Structure

```
src/app/[locale]/(admin)/admin/
├── layout.tsx              ← Shared layout: auth guard + sidebar + header
├── page.tsx                ← Overview with stat cards
├── loading.tsx             ← Skeleton loading state
├── error.tsx               ← Error boundary (client component)
├── clients/
│   ├── page.tsx            ← Client management table
│   ├── loading.tsx
│   └── error.tsx
├── accounts/
│   ├── page.tsx            ← Social account overview
│   ├── loading.tsx
│   └── error.tsx
├── posts/
│   ├── page.tsx            ← Post moderation
│   ├── loading.tsx
│   └── error.tsx
├── jobs/
│   ├── page.tsx            ← Background job monitoring
│   ├── loading.tsx
│   └── error.tsx
├── revenue/
│   ├── page.tsx            ← Revenue dashboard
│   ├── loading.tsx
│   └── error.tsx
└── system/
    ├── page.tsx            ← System health & uptime
    ├── loading.tsx
    └── error.tsx
```

### Component Directory

```
src/components/admin/
├── AdminSidebar.tsx         ← Navigation sidebar (client component)
├── AdminHeader.tsx          ← Top header bar (client component)
├── AdminStatCard.tsx        ← Reusable stat card (server component)
├── ClientsTable.tsx         ← Client management table
├── AccountsTable.tsx        ← Social accounts table
├── PostModerationTable.tsx  ← Post moderation with bulk actions
├── BulkActionBar.tsx        ← Multi-select action toolbar
├── JobMonitorTable.tsx      ← Background job status table
├── JobStatsCards.tsx         ← Job summary stat cards
├── RevenueMetrics.tsx       ← Revenue overview metrics
├── RevenueTrend.tsx         ← Revenue trending chart
├── TierDistribution.tsx     ← Subscription tier breakdown
├── ApiHealthStatus.tsx      ← Platform API health monitor
├── PlatformDistribution.tsx ← Platform usage distribution
├── UptimeDisplay.tsx        ← Uptime metrics display
├── RateLimitMonitor.tsx     ← API rate limit tracking
├── ErrorLog.tsx             ← System error log viewer
└── __tests__/               ← Component tests
```

### API Routes

```
src/app/api/admin/
├── stats/route.ts           ← GET  Platform overview statistics
├── clients/route.ts         ← GET  Paginated client list (search, filter, sort)
├── accounts/route.ts        ← GET  Social account data
├── posts/route.ts           ← GET  Post listing with filters
├── posts/bulk/route.ts      ← POST Bulk post actions (approve, reject, delete)
├── jobs/route.ts            ← GET  Background job status
├── jobs/retry/route.ts      ← POST Retry failed jobs
├── revenue/route.ts         ← GET  Subscription and billing data
└── system/route.ts          ← GET  System health and uptime
```

## Key Patterns

### 1. Admin Auth Guard

Every admin page is protected by the shared layout calling `requireAdminSession()`. Individual pages do NOT need to re-check auth.

**`src/lib/admin-session.ts`** exports two functions:

```typescript
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";

// Redirect-based guard for pages — use in layout.tsx
export async function requireAdminSession() {
  const session = await getServerSession();

  if (!session) {
    logger.warn("Admin access attempted without session");
    redirect("/login?callbackUrl=%2Fadmin");
  }

  if (session.user.role !== "admin") {
    logger.warn("Non-admin user attempted admin access", {
      userId: session.user.id,
      role: session.user.role ?? "user",
    });
    redirect("/dashboard");
  }

  return session; // session.user.role === "admin" guaranteed
}

// Boolean check for conditional rendering — no redirect
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession();
  return session?.user.role === "admin";
}
```

**Layout usage** — the layout calls the guard once; child pages inherit protection:

```typescript
// src/app/[locale]/(admin)/admin/layout.tsx
export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireAdminSession();

  return (
    <div className="min-h-dvh bg-slate-950">
      <AdminSidebar />
      <div className="flex flex-col md:ml-[260px]">
        <AdminHeader
          userName={session.user.name ?? "Admin"}
          userEmail={session.user.email}
          userImage={session.user.image ?? undefined}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
```

### 2. API Route Protection

API routes cannot use `requireAdminSession()` (it calls `redirect()`). Instead, they check session and role manually and return JSON error responses:

```typescript
// src/app/api/admin/*/route.ts
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden — admin access required" },
        { status: 403 },
      );
    }

    // ... fetch data with Drizzle ORM ...
  } catch (error) {
    logger.error("Admin API error", { error: ... });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### 3. Server → Client Data Flow

Admin pages follow a consistent pattern: **server component fetches data → passes to client component as props**.

```typescript
// page.tsx (server component — no "use client")
export default async function AdminClientsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const clients = await getClients(); // Drizzle query

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">
          Client Management
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          View and manage platform users.
        </p>
      </div>

      {/* Client component handles interactivity */}
      <ClientsTable initialData={clients} />
    </div>
  );
}
```

```typescript
// ClientsTable.tsx (client component — "use client")
"use client";

interface ClientsTableProps {
  initialData: Client[];
}

export function ClientsTable({ initialData }: ClientsTableProps) {
  const [data, setData] = useState(initialData);
  // Search, filter, pagination state...
}
```

### 4. AdminStatCard Usage

`AdminStatCard` is a server component for displaying metrics. Always use `en-ZA` locale for number formatting:

```typescript
import { AdminStatCard } from "@/components/admin/AdminStatCard";

<AdminStatCard
  label="Total Users"
  value={stats.totalUsers.toLocaleString("en-ZA")}
  description="+12% from last month"
  icon={<UsersIcon />}
  trend="up"    // "up" = emerald, "down" = red, "neutral" = slate
/>
```

### 5. Loading States (Skeleton UI)

Every admin page has a `loading.tsx` that renders skeleton cards matching the page layout:

```typescript
// loading.tsx — server component, no "use client"
export default function AdminClientsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-7 w-48 animate-pulse rounded bg-slate-800" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-800/60" />
      </div>

      {/* Content skeleton — match the real page structure */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-slate-800/40 mb-2" />
        ))}
      </div>
    </div>
  );
}
```

Skeleton rules:
- Use `animate-pulse` on `bg-slate-800` / `bg-slate-800/60` elements
- Match the visual structure of the loaded page
- Use `rounded-xl border border-slate-700/50 bg-slate-900/50` for card skeletons

### 6. Error Boundaries

Every admin page has an `error.tsx` client component:

```typescript
"use client";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-red-500/20 bg-slate-900/50 p-6 text-center">
        <h2 className="text-lg font-semibold text-slate-100">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          An error occurred while loading this admin page.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-slate-600">Error ID: {error.digest}</p>
        )}
        <button type="button" onClick={reset}
          className="mt-4 rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-500/30">
          Try again
        </button>
      </div>
    </div>
  );
}
```

### 7. Test Patterns

Tests live in `src/components/admin/__tests__/` and `src/lib/__tests__/`.

**Component tests** use React Testing Library + Vitest:

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { AccountsTable } from "../AccountsTable";

const MOCK_ACCOUNTS = [
  { id: "1", platform: "instagram", handle: "@brand", status: "active" },
  // ...
];

describe("AccountsTable", () => {
  it("renders account rows", () => {
    render(<AccountsTable initialData={MOCK_ACCOUNTS} />);
    expect(screen.getAllByTestId("account-row")).toHaveLength(MOCK_ACCOUNTS.length);
  });

  it("filters by search query", async () => {
    const user = userEvent.setup();
    render(<AccountsTable initialData={MOCK_ACCOUNTS} />);
    await user.type(screen.getByRole("searchbox"), "brand");
    expect(screen.getAllByTestId("account-row")).toHaveLength(1);
  });
});
```

**Auth guard tests** mock `redirect()` and `getServerSession()`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); }),
}));
vi.mock("@/lib/auth-session", () => ({
  getServerSession: vi.fn(),
}));

describe("requireAdminSession", () => {
  it("returns session for admin users", async () => {
    mockGetServerSession.mockResolvedValue(makeSession("admin"));
    const session = await requireAdminSession();
    expect(session.user.role).toBe("admin");
  });

  it("redirects non-admin to /dashboard", async () => {
    mockGetServerSession.mockResolvedValue(makeSession("user"));
    await expect(requireAdminSession()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
  });
});
```

## Dark Theme Styling

All admin pages use a consistent dark slate palette. Reference these classes:

| Purpose | Class |
|---------|-------|
| Page background | `bg-slate-950` |
| Card background | `bg-slate-900/50` |
| Card border | `border-slate-700/50` |
| Card hover border | `hover:border-slate-600/50` |
| Interactive surface | `bg-slate-800` |
| Primary text | `text-slate-100` |
| Secondary text | `text-slate-400` |
| Muted text | `text-slate-500` |
| Accent background | `bg-purple-500/10` or `bg-purple-500/20` |
| Accent text | `text-purple-400` |
| Accent hover | `hover:text-purple-300` |
| Status: healthy | `text-emerald-400` |
| Status: error | `text-red-400` |
| Status: neutral | `text-slate-400` |
| Button (primary) | `bg-purple-500/20 text-purple-300 hover:bg-purple-500/30` |
| Skeleton pulse | `animate-pulse bg-slate-800` |

Card wrapper pattern:

```
rounded-xl border border-slate-700/50 bg-slate-900/50 p-5 transition-colors hover:border-slate-600/50
```

## SA Conventions

- **Timezone**: Use `Africa/Johannesburg` (SAST, UTC+2) for all date displays
- **Number formatting**: `value.toLocaleString("en-ZA")`
- **Currency**: Format as ZAR — `new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(amount)`
- **Metadata**: Set `robots: { index: false, follow: false }` on admin pages (no search indexing)

## Adding a New Admin Page

Follow this step-by-step guide to add a new admin section (e.g. `/admin/analytics`):

### Step 1: Create the Route Files

```
src/app/[locale]/(admin)/admin/analytics/
├── page.tsx
├── loading.tsx
└── error.tsx
```

### Step 2: Create `page.tsx`

```typescript
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/db";
import { logger } from "@/lib/logger";

export const metadata: Metadata = {
  title: "Analytics — Admin Dashboard",
};

type Props = {
  params: Promise<{ locale: string }>;
};

async function getAnalyticsData() {
  try {
    // Drizzle ORM query — use Promise.all for parallel fetches
    const [metrics] = await Promise.all([
      db.select().from(analyticsTable),
    ]);
    return { metrics };
  } catch (error) {
    logger.error("Failed to fetch analytics", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { metrics: [] };
  }
}

export default async function AdminAnalyticsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = await getAnalyticsData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">
          Analytics
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Platform usage analytics and insights.
        </p>
      </div>

      {/* Your content here — use AdminStatCard, tables, charts */}
    </div>
  );
}
```

### Step 3: Create `loading.tsx` and `error.tsx`

Copy from an existing admin section and adjust the skeleton structure to match your page layout.

### Step 4: Add to Sidebar Navigation

In `src/components/admin/AdminSidebar.tsx`, add your page to the appropriate `NAV_SECTIONS` group:

```typescript
const NAV_SECTIONS = [
  {
    label: "Platform",
    items: [
      { label: "Overview", href: "/admin" },
      { label: "Clients", href: "/admin/clients" },
      // ...
      { label: "Analytics", href: "/admin/analytics" },  // ← Add here
    ],
  },
  // ...
];
```

### Step 5: Create API Route (if needed)

```
src/app/api/admin/analytics/route.ts
```

Use the API route protection pattern from [Key Patterns §2](#2-api-route-protection).

### Step 6: Create Client Components (if needed)

Place interactive components in `src/components/admin/AnalyticsChart.tsx` etc. Mark with `"use client"` and accept data via props from the server page.

### Step 7: Add Tests

Create `src/components/admin/__tests__/AnalyticsChart.test.tsx`:
- Mock data arrays matching your schema
- Test rendering, user interactions, and edge cases
- Use `data-testid` attributes for reliable selectors

### Step 8: Verify

```bash
npm run build   # Ensure no TypeScript errors
npm run test:run # Ensure tests pass
```
