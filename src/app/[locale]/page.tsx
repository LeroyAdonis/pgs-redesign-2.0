/**
 * Home page — Purple Glow Social 2.0
 *
 * Landing page with i18n support. Uses next-intl for all user-facing strings.
 * This is a server component that reads translations at render time.
 */

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { LanguageSelector } from "@/components/ui/language-selector";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

/**
 * Extracted as a sync component so useTranslations works
 * (useTranslations is a hook and must be called synchronously).
 */
function HomeContent() {
  const t = useTranslations();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4">
      <div className="mx-auto max-w-2xl text-center">
        {/* Language selector in top-right corner */}
        <div className="fixed right-4 top-4 z-50">
          <LanguageSelector />
        </div>

        {/* Purple glow accent ring */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-brand-surface shadow-glow">
          <svg
            className="h-10 w-10 text-brand"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
            />
          </svg>
        </div>

        <h1 className="font-display text-5xl font-bold tracking-tight text-text">
          {t("app.title")}
        </h1>

        <p className="mt-4 text-lg text-text-secondary">
          {t("landing.hero")}
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-surface px-4 py-2 text-sm font-medium text-brand">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            {t("landing.techStack")}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface-raised p-4">
            <h3 className="font-medium text-text">
              🏗️ {t("landing.foundation")}
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              {t("landing.foundationDesc")}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-raised p-4">
            <h3 className="font-medium text-text">
              🎨 {t("landing.designSystem")}
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              {t("landing.designSystemDesc")}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-raised p-4">
            <h3 className="font-medium text-text">
              🇿🇦 {t("landing.southAfrican")}
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              {t("landing.southAfricanDesc")}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
