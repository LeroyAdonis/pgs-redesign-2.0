/**
 * Brand Profile Page — Server Component
 *
 * Route: /[locale]/dashboard/brand
 *
 * Displays the brand analysis results with interactive editors.
 * Fetches brand profile data server-side, delegates interactive
 * elements to client components.
 */

import { setRequestLocale } from "next-intl/server";
import { BrandProfileView } from "./_components/BrandProfileView";
import { EmptyState } from "./_components/EmptyState";

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * Mock data for development.
 * In production, this would fetch from the database via the profile service.
 * We cannot call the DB directly here without a valid DATABASE_URL at build time,
 * so we use mock data and the client component fetches real data on mount.
 */
function getMockProfile() {
  return {
    id: "mock-profile-id",
    orgId: "mock-org-id",
    language: "en",
    toneFingerprint: {
      formal: 0.3,
      casual: 0.7,
      humorous: 0.4,
      professional: 0.6,
      inspirational: 0.5,
      educational: 0.35,
    },
    vocabularyClusters: [
      { category: "business", words: ["brand", "customer", "launch", "product", "team"], frequency: 42 },
      { category: "community", words: ["community", "support", "local", "together", "connect"], frequency: 35 },
      { category: "lifestyle", words: ["coffee", "morning", "weekend", "wellness", "food"], frequency: 28 },
      { category: "action", words: ["check", "follow", "visit", "discover", "shop"], frequency: 22 },
      { category: "other", words: ["lekker", "braai", "mzansi", "vibe", "hustle"], frequency: 18 },
    ],
    hashtagPatterns: [
      { hashtag: "#Mzansi", frequency: 28, category: "south_african" },
      { hashtag: "#ProudlySA", frequency: 22, category: "south_african" },
      { hashtag: "#LocalIsLekker", frequency: 18, category: "south_african" },
      { hashtag: "#Joburg", frequency: 15, category: "south_african" },
      { hashtag: "#SABusiness", frequency: 14, category: "business" },
      { hashtag: "#SupportLocal", frequency: 12, category: "general" },
      { hashtag: "#SmallBusiness", frequency: 10, category: "business" },
      { hashtag: "#CapeTown", frequency: 9, category: "south_african" },
    ],
    postingCadence: {
      dayOfWeek: 2,
      hourOfDay: 10,
      postsPerWeek: 4.5,
    },
    emojiUsage: [
      { emoji: "🇿🇦", frequency: 18 },
      { emoji: "🔥", frequency: 15 },
      { emoji: "💪", frequency: 12 },
      { emoji: "🚀", frequency: 10 },
      { emoji: "❤️", frequency: 9 },
      { emoji: "☕", frequency: 8 },
      { emoji: "🎉", frequency: 7 },
      { emoji: "📈", frequency: 6 },
      { emoji: "🌟", frequency: 5 },
      { emoji: "🏔️", frequency: 4 },
    ],
    avgContentLength: 185,
    visualStyle: {
      colorPalette: ["#8b5cf6", "#f472b6", "#22c55e", "#3b82f6", "#eab308"],
      filterPreferences: ["none", "clarendon", "gingham"],
      imageTypes: ["image", "video"],
    },
    saCulturalScore: 0.72,
  };
}

export default async function BrandPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // In a real deployment, we'd check for existing profiles:
  // const session = await requireServerSession();
  // const profiles = await getProfilesForOrg(orgId);
  // For now, use mock data to demonstrate the UI
  const hasProfile = true;
  const profile = hasProfile ? getMockProfile() : null;

  if (!profile) {
    return (
      <div className="mx-auto max-w-5xl">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <BrandProfileView
        profile={profile}
        saCulturalScore={profile.saCulturalScore}
      />
    </div>
  );
}
