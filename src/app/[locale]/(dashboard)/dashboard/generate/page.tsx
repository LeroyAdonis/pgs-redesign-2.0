/**
 * Content Studio (Generate) Page — Server Component
 *
 * Route: /[locale]/dashboard/generate
 *
 * AI-powered content generation studio for social media posts.
 * Authenticates the user server-side, then delegates to the
 * ContentStudio client component for interactive generation.
 */

import { setRequestLocale } from "next-intl/server";
import { requireServerSession } from "@/lib/auth-session";
import { ContentStudio } from "./_components/ContentStudio";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata() {
  return {
    title: "Content Studio | Purple Glow Social",
    description: "Generate AI-powered social media content for South African audiences",
  };
}

export default async function GeneratePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Auth guard — redirects to /login if not authenticated
  await requireServerSession();

  return (
    <div className="mx-auto max-w-6xl">
      <ContentStudio />
    </div>
  );
}
