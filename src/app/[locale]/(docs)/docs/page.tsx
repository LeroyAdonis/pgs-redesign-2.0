/**
 * Docs landing page — /docs
 *
 * Shows an overview of all documentation sections with links to each guide.
 * Public page, no auth required.
 */

import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Everything you need to know about Purple Glow Social — guides, tutorials, and API reference.",
};

type Props = {
  params: Promise<{ locale: string }>;
};

/* ─── Doc sections with their route slugs ─── */

const DOC_SECTIONS = [
  { slug: "getting-started", titleKey: "gettingStarted" },
  { slug: "linking-accounts", titleKey: "linkingAccounts" },
  { slug: "ai-content", titleKey: "aiContent" },
  { slug: "scheduling", titleKey: "scheduling" },
  { slug: "billing-faq", titleKey: "billingFaq" },
  { slug: "api-reference", titleKey: "apiReference" },
] as const;

export default async function DocsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("docs");

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
        {t("landing.title")}
      </h1>
      <p className="mb-10 text-lg text-slate-400">
        {t("landing.description")}
      </p>

      {/* Doc section cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {DOC_SECTIONS.map((section) => (
          <a
            key={section.slug}
            href={`/${locale}/docs/${section.slug}`}
            className="group rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition-all duration-200 hover:border-purple-500/40 hover:bg-slate-900"
          >
            <h2 className="mb-1.5 text-base font-semibold text-slate-200 group-hover:text-purple-400">
              {t(`${section.titleKey}.title`)}
            </h2>
            <p className="text-sm leading-relaxed text-slate-500">
              {t(`${section.titleKey}.description`)}
            </p>
          </a>
        ))}
      </div>
    </>
  );
}
