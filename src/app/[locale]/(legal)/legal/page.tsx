/**
 * Legal landing page — /legal
 *
 * Shows an index of all legal documents with links to each policy.
 * Public page, no auth required.
 */

import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";

export const metadata: Metadata = {
  title: "Legal",
  description:
    "Legal information, privacy policy, terms of service, and regulatory compliance for Purple Glow Social.",
};

type Props = {
  params: Promise<{ locale: string }>;
};

/* ─── Legal document sections with their route slugs ─── */

const LEGAL_SECTIONS = [
  { slug: "privacy", titleKey: "privacy" },
  { slug: "terms", titleKey: "terms" },
  { slug: "cookies", titleKey: "cookies" },
  { slug: "paia", titleKey: "paia" },
  { slug: "acceptable-use", titleKey: "acceptableUse" },
] as const;

export default async function LegalPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("legal");

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: t("title") },
        ]}
        className="mb-8"
      />

      <h1 className="mb-3 text-3xl font-bold text-white">
        {t("title")}
      </h1>
      <p className="mb-10 text-lg text-slate-400">
        Purple Glow Social is committed to transparency. Review our legal
        documents below.
      </p>

      {/* Legal document cards */}
      <div className="space-y-3">
        {LEGAL_SECTIONS.map((section) => (
          <a
            key={section.slug}
            href={`/${locale}/legal/${section.slug}`}
            className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-4 transition-all duration-200 hover:border-purple-500/40 hover:bg-slate-900"
          >
            <div>
              <h2 className="text-base font-semibold text-slate-200 group-hover:text-purple-400">
                {t(`${section.titleKey}.title`)}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {t(`${section.titleKey}.description`)}
              </p>
            </div>
            <span className="shrink-0 text-slate-600 transition-colors group-hover:text-purple-400" aria-hidden="true">
              →
            </span>
          </a>
        ))}
      </div>
    </>
  );
}
