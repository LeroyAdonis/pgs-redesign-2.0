/**
 * Brand Profile Page — Server Component
 *
 * Route: /[locale]/dashboard/brand
 *
 * Shows brand analysis once the user has connected social accounts
 * and generated enough content for analysis. Before that, shows
 * a helpful empty state guiding the user to connect accounts first.
 */

import { setRequestLocale } from "next-intl/server";
import { requireServerSession } from "@/lib/auth-session";
import Link from "next/link";
import { db } from "@/db";
import { brandProfile, organizationMember, socialAccount } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BrandProfileView } from "./_components/BrandProfileView";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function BrandPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requireServerSession();

  // Get user's org
  const memberships = await db
    .select({ orgId: organizationMember.orgId })
    .from(organizationMember)
    .where(eq(organizationMember.userId, session.user.id))
    .limit(1);

  const orgId = memberships[0]?.orgId;

  if (!orgId) {
    return <EmptyState locale={locale} type="onboarding" />;
  }

  // Check if user has connected social accounts
  const accounts = await db
    .select({ id: socialAccount.id })
    .from(socialAccount)
    .where(eq(socialAccount.orgId, orgId))
    .limit(1);

  if (accounts.length === 0) {
    return <EmptyState locale={locale} type="accounts" />;
  }

  // Query brand profiles for this org
  const profiles = await db
    .select()
    .from(brandProfile)
    .where(eq(brandProfile.orgId, orgId));

  if (profiles.length === 0) {
    return <EmptyState locale={locale} type="generate" />;
  }

  // Use the first profile (primary brand profile)
  const profile = profiles[0];

  return (
    <BrandProfileView
      profile={{
        id: profile.id,
        orgId: profile.orgId,
        language: profile.language,
        toneFingerprint: profile.toneFingerprint ?? {
          formal: 0.5,
          casual: 0.5,
          humorous: 0.3,
          professional: 0.7,
          inspirational: 0.4,
          educational: 0.5,
        },
        vocabularyClusters: profile.vocabularyClusters ?? [],
        hashtagPatterns: profile.hashtagPatterns ?? [],
        postingCadence: profile.postingCadence ?? {
          dayOfWeek: 1,
          hourOfDay: 9,
          postsPerWeek: 3,
        },
        emojiUsage: profile.emojiUsage ?? [],
        avgContentLength: profile.avgContentLength ?? 0,
        visualStyle: profile.visualStyle ?? {
          colorPalette: [],
          filterPreferences: [],
          imageTypes: [],
        },
      }}
      saCulturalScore={0.65}
    />
  );
}

/* ─── Empty State Component ─── */

function EmptyState({ locale, type }: { locale: string; type: "onboarding" | "accounts" | "generate" }) {
  const content = {
    onboarding: {
      icon: "🏢",
      title: "Set up your business first",
      description: "Complete onboarding to create your organization, then connect your social accounts.",
      action: { label: "Go to Onboarding", href: `/${locale}/onboarding` },
    },
    accounts: {
      icon: "🔗",
      title: "Connect a social account",
      description: "Link your Instagram, Facebook, or Twitter account so we can analyze your brand's voice and style.",
      action: { label: "Connect Accounts", href: `/${locale}/dashboard/accounts` },
    },
    generate: {
      icon: "✨",
      title: "Generate some content first",
      description: "Create a few posts using the AI content generator. Once we have enough data, we'll build your brand profile automatically.",
      action: { label: "Generate Content", href: `/${locale}/dashboard/generate` },
    },
  }[type];

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-surface text-3xl">
        {content.icon}
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold text-text">
        {content.title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">
        {content.description}
      </p>
      <Link
        href={content.action.href}
        className="mt-8 inline-flex items-center gap-2 bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
      >
        {content.action.label}
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </div>
  );
}
