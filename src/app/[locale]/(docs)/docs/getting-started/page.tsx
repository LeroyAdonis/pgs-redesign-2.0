/**
 * Getting Started — /docs/getting-started
 *
 * Step-by-step onboarding guide with visual step indicators.
 * Walks new users through account creation → first scheduled post.
 * Preserves the interactive tutorial replay feature.
 */

import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { ReplayTutorialButton } from "@/components/tutorial/ReplayTutorialButton";
import {
  TableOfContents,
  type TocSection,
} from "@/components/docs/TableOfContents";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "docs.gettingStarted" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

/* ─── Table of Contents ─── */

const TOC_SECTIONS: TocSection[] = [
  { id: "overview", title: "Overview" },
  { id: "step-1", title: "1. Create Your Account" },
  { id: "step-2", title: "2. Choose Your Plan" },
  { id: "step-3", title: "3. Link Your Social Accounts" },
  { id: "step-4", title: "4. Set Up Your Brand Profile" },
  { id: "step-5", title: "5. Create & Schedule Your First Post" },
  { id: "next-steps", title: "Next Steps" },
];

/* ─── Step Indicator ─── */

function StepIndicator({ step, isLast }: { step: number; isLast?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-400 ring-2 ring-purple-500/40">
        {step}
      </div>
      {!isLast && (
        <div className="mt-2 h-full w-0.5 bg-gradient-to-b from-purple-500/40 to-slate-700/30" />
      )}
    </div>
  );
}

/* ─── Page ─── */

export default async function GettingStartedPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("docs");
  const tTutorial = await getTranslations("tutorial");

  return (
    <div className="flex gap-10">
      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-12">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: t("title"), href: `/${locale}/docs` },
            { label: t("gettingStarted.title") },
          ]}
          className="mb-8"
        />

        {/* Header */}
        <header id="overview">
          <h1 className="mb-3 text-3xl font-bold text-white">
            {t("gettingStarted.title")}
          </h1>
          <p className="text-lg text-slate-400">
            {t("gettingStarted.description")}
          </p>

          {/* Time estimate badge */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" />
              <path strokeLinecap="round" d="M8 4.5V8l2.5 1.5" />
            </svg>
            ~10 minutes to get started
          </div>
        </header>

        {/* Interactive tutorial replay */}
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6">
          <h2 className="mb-2 text-base font-semibold text-purple-400">
            {tTutorial("title")}
          </h2>
          <p className="mb-4 text-sm text-slate-400">
            {tTutorial("description")}
          </p>
          <ReplayTutorialButton />
        </div>

        {/* ── Step 1: Create Your Account ── */}
        <section id="step-1" className="flex gap-5">
          <StepIndicator step={1} />
          <div className="flex-1 pb-8">
            <h2 className="mb-3 text-xl font-bold text-white">
              {t("gettingStarted.step1Title")}
            </h2>
            <p className="mb-4 leading-relaxed text-slate-300">
              {t("gettingStarted.step1Description")}. Head to the sign-up page
              and create your account using your email address or sign in with
              Google. You&apos;ll receive a verification email — click the link
              to activate your account.
            </p>

            <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-200">
                What you&apos;ll need:
              </h3>
              <ul className="space-y-1.5 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-purple-400">•</span>
                  A valid email address
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-purple-400">•</span>
                  A strong password (minimum 8 characters)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-purple-400">•</span>
                  Your business or brand name
                </li>
              </ul>
            </div>

            {/* Tip callout */}
            <div className="mt-4 rounded-lg border-l-4 border-purple-500 bg-slate-800/50 p-4">
              <p className="text-sm font-semibold text-purple-300">💡 Tip</p>
              <p className="mt-1 text-sm text-slate-400">
                Use Google sign-in for the fastest setup — no email verification
                needed. You can always add a password later.
              </p>
            </div>
          </div>
        </section>

        {/* ── Step 2: Choose Your Plan ── */}
        <section id="step-2" className="flex gap-5">
          <StepIndicator step={2} />
          <div className="flex-1 pb-8">
            <h2 className="mb-3 text-xl font-bold text-white">
              Choose Your Plan
            </h2>
            <p className="mb-4 leading-relaxed text-slate-300">
              Purple Glow Social offers three tiers to suit every South African
              business — from solo hustlers to enterprise moguls.
            </p>

            {/* Plan cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Hustler */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-green-400">
                  Free
                </div>
                <h3 className="mb-1 text-base font-bold text-white">
                  Hustler
                </h3>
                <p className="mb-3 text-xs text-slate-400">
                  Perfect for getting started
                </p>
                <ul className="space-y-1 text-xs text-slate-300">
                  <li>✓ 1 social account</li>
                  <li>✓ 10 AI credits/month</li>
                  <li>✓ Basic scheduling</li>
                  <li>✓ Community support</li>
                </ul>
              </div>

              {/* Growler */}
              <div className="rounded-xl border border-purple-500/40 bg-purple-500/5 p-4 ring-1 ring-purple-500/20">
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-purple-400">
                  Popular
                </div>
                <h3 className="mb-1 text-base font-bold text-white">
                  Growler
                </h3>
                <p className="mb-3 text-xs text-slate-400">
                  For growing businesses
                </p>
                <ul className="space-y-1 text-xs text-slate-300">
                  <li>✓ 5 social accounts</li>
                  <li>✓ 100 AI credits/month</li>
                  <li>✓ Advanced scheduling</li>
                  <li>✓ Analytics dashboard</li>
                  <li>✓ Priority support</li>
                </ul>
              </div>

              {/* Mogul */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-400">
                  Premium
                </div>
                <h3 className="mb-1 text-base font-bold text-white">
                  Mogul
                </h3>
                <p className="mb-3 text-xs text-slate-400">
                  Enterprise-grade power
                </p>
                <ul className="space-y-1 text-xs text-slate-300">
                  <li>✓ Unlimited accounts</li>
                  <li>✓ 500 AI credits/month</li>
                  <li>✓ API access</li>
                  <li>✓ Team collaboration</li>
                  <li>✓ Dedicated support</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-lg border-l-4 border-purple-500 bg-slate-800/50 p-4">
              <p className="text-sm font-semibold text-purple-300">💡 Tip</p>
              <p className="mt-1 text-sm text-slate-400">
                Start with Hustler (free) to explore the platform. You can
                upgrade at any time — all your content and settings carry over.
              </p>
            </div>
          </div>
        </section>

        {/* ── Step 3: Link Your Social Accounts ── */}
        <section id="step-3" className="flex gap-5">
          <StepIndicator step={3} />
          <div className="flex-1 pb-8">
            <h2 className="mb-3 text-xl font-bold text-white">
              {t("gettingStarted.step2Title")}
            </h2>
            <p className="mb-4 leading-relaxed text-slate-300">
              {t("gettingStarted.step2Description")}. We currently support five
              major platforms. Each connection uses secure OAuth — we never store
              your social media passwords.
            </p>

            {/* Supported platforms */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                { name: "Instagram", colour: "from-pink-500 to-purple-600" },
                { name: "Facebook", colour: "from-blue-500 to-blue-700" },
                { name: "X / Twitter", colour: "from-slate-400 to-slate-600" },
                { name: "LinkedIn", colour: "from-sky-500 to-sky-700" },
                { name: "TikTok", colour: "from-rose-500 to-cyan-500" },
              ].map((platform) => (
                <div
                  key={platform.name}
                  className="flex flex-col items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/50 p-3"
                >
                  <div
                    className={`h-8 w-8 rounded-lg bg-gradient-to-br ${platform.colour}`}
                  />
                  <span className="text-xs font-medium text-slate-300">
                    {platform.name}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-slate-400">
              Navigate to <strong className="text-slate-200">Settings → Social Accounts</strong> and
              click &ldquo;Connect&rdquo; next to each platform. You&apos;ll be
              redirected to authorise access, then brought back automatically.
            </p>
          </div>
        </section>

        {/* ── Step 4: Set Up Your Brand Profile ── */}
        <section id="step-4" className="flex gap-5">
          <StepIndicator step={4} />
          <div className="flex-1 pb-8">
            <h2 className="mb-3 text-xl font-bold text-white">
              {t("gettingStarted.step3Title")}
            </h2>
            <p className="mb-4 leading-relaxed text-slate-300">
              {t("gettingStarted.step3Description")}. Once your social accounts
              are linked, our AI scans your recent posts to build a brand
              profile — capturing your tone, vocabulary, emoji usage, hashtag
              preferences, and content style.
            </p>

            <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">
                Your brand profile includes:
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: "Tone Fingerprint",
                    desc: "Professional, casual, witty, inspirational — we detect your unique voice",
                  },
                  {
                    label: "Vocabulary Clusters",
                    desc: "Key phrases and words your brand frequently uses",
                  },
                  {
                    label: "Hashtag Patterns",
                    desc: "Your preferred hashtags, including local SA tags like #Mzansi",
                  },
                  {
                    label: "Posting Cadence",
                    desc: "How often and when you typically post",
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-slate-900/50 p-3">
                    <p className="text-sm font-medium text-purple-300">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg border-l-4 border-purple-500 bg-slate-800/50 p-4">
              <p className="text-sm font-semibold text-purple-300">💡 Tip</p>
              <p className="mt-1 text-sm text-slate-400">
                The more posts we can analyse, the better your brand profile
                will be. Accounts with 20+ recent posts produce the most
                accurate results.
              </p>
            </div>
          </div>
        </section>

        {/* ── Step 5: Create & Schedule Your First Post ── */}
        <section id="step-5" className="flex gap-5">
          <StepIndicator step={5} isLast />
          <div className="flex-1 pb-8">
            <h2 className="mb-3 text-xl font-bold text-white">
              {t("gettingStarted.step4Title")} &amp; {t("gettingStarted.step5Title")}
            </h2>
            <p className="mb-4 leading-relaxed text-slate-300">
              {t("gettingStarted.step4Description")} and{" "}
              {t("gettingStarted.step5Description").toLowerCase()}. Head to the{" "}
              <strong className="text-slate-200">Content Studio</strong> and
              click &ldquo;New Post&rdquo;.
            </p>

            <ol className="mb-4 space-y-3 text-sm text-slate-300">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                  a
                </span>
                <span>
                  Choose your target platform(s) and content type (text post,
                  image caption, or carousel)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                  b
                </span>
                <span>
                  Enter a brief topic or prompt — or let the AI suggest ideas
                  based on your brand profile
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                  c
                </span>
                <span>
                  Review and customise the generated content — edit text, adjust
                  hashtags, tweak the tone
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                  d
                </span>
                <span>
                  Pick a date and time (we suggest optimal times in SAST), then
                  hit &ldquo;Schedule&rdquo;
                </span>
              </li>
            </ol>

            {/* Success callout */}
            <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
              <p className="text-sm font-semibold text-green-400">
                🎉 That&apos;s it!
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Your first post is scheduled. Purple Glow Social will publish it
                automatically at the time you chose. You can track its
                performance in the Analytics dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* ── Next Steps ── */}
        <section id="next-steps" className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Next Steps</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Link more accounts",
                desc: "Connect all your social platforms for cross-posting",
                href: "linking-accounts",
              },
              {
                title: "Explore AI content",
                desc: "Learn how to get the best results from our AI engine",
                href: "ai-content",
              },
              {
                title: "Set up scheduling",
                desc: "Build a content calendar with optimal posting times",
                href: "scheduling",
              },
              {
                title: "Review your plan",
                desc: "Understand credits, billing, and upgrade options",
                href: "billing-faq",
              },
            ].map((link) => (
              <a
                key={link.href}
                href={`/${locale}/docs/${link.href}`}
                className="group rounded-lg border border-slate-700/50 bg-slate-900/50 p-4 transition-all duration-200 hover:border-purple-500/40 hover:bg-slate-900"
              >
                <p className="text-sm font-semibold text-slate-200 group-hover:text-purple-400">
                  {link.title} →
                </p>
                <p className="mt-1 text-xs text-slate-500">{link.desc}</p>
              </a>
            ))}
          </div>
        </section>
      </div>

      {/* Sidebar: Table of Contents */}
      <TableOfContents sections={TOC_SECTIONS} className="w-48 shrink-0" />
    </div>
  );
}
