/**
 * AI Content Guide — /docs/ai-content
 *
 * Explains how AI content generation works, brand voice analysis,
 * content types, credit usage, and South African context features.
 */

import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import {
  TableOfContents,
  type TocSection,
} from "@/components/docs/TableOfContents";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "docs.aiContent" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

/* ─── Table of Contents ─── */

const TOC_SECTIONS: TocSection[] = [
  { id: "overview", title: "Overview" },
  { id: "how-it-works", title: "How It Works" },
  { id: "brand-voice", title: "Brand Voice Analysis" },
  { id: "content-types", title: "Content Types" },
  { id: "sa-context", title: "South African Context" },
  { id: "tips", title: "Tips for Better Content" },
  { id: "editing", title: "Editing AI Suggestions" },
  { id: "credits", title: "Credit Usage" },
];

/* ─── Page ─── */

export default async function AiContentPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("docs");

  return (
    <div className="flex gap-10">
      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-12">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: t("title"), href: `/${locale}/docs` },
            { label: t("aiContent.title") },
          ]}
          className="mb-8"
        />

        {/* Header */}
        <header id="overview">
          <h1 className="mb-3 text-3xl font-bold text-white">
            {t("aiContent.title")}
          </h1>
          <p className="text-lg text-slate-400">
            {t("aiContent.description")}. Our AI engine generates on-brand
            social media content that sounds like you — not a robot. Built with
            South African context at its core.
          </p>
        </header>

        {/* ── How It Works ── */}
        <section id="how-it-works">
          <h2 className="mb-4 text-xl font-bold text-white">How It Works</h2>
          <p className="mb-6 text-slate-300">
            Purple Glow Social uses advanced AI models fine-tuned for social
            media content creation. Here&apos;s the pipeline from prompt to
            published post:
          </p>

          <div className="space-y-3">
            {[
              {
                step: "1",
                title: "Input",
                desc: "You provide a topic, brief, or prompt — or select from AI-suggested ideas based on trending topics in your industry.",
              },
              {
                step: "2",
                title: "Brand Profile Matching",
                desc: "The AI loads your brand profile (tone, vocabulary, style) to ensure the output matches your voice.",
              },
              {
                step: "3",
                title: "Content Generation",
                desc: "The model generates multiple variations tailored to your chosen platform(s) and content type.",
              },
              {
                step: "4",
                title: "SA Context Layer",
                desc: "Local slang, Mzansi references, SA hashtags, and cultural context are woven in where appropriate.",
              },
              {
                step: "5",
                title: "Review & Customise",
                desc: "You review the suggestions, edit as needed, and approve the final version for publishing or scheduling.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-4 rounded-lg border border-slate-700/50 bg-slate-800/50 p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-400">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Brand Voice Analysis ── */}
        <section id="brand-voice">
          <h2 className="mb-4 text-xl font-bold text-white">
            Brand Voice Analysis
          </h2>
          <p className="mb-4 text-slate-300">
            When you first connect your social accounts, our AI performs a
            comprehensive brand scan by analysing your recent posts. This creates
            a unique brand fingerprint used for all future content generation.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Tone Detection",
                desc: "We identify whether your brand voice is professional, casual, humorous, inspirational, authoritative, or a blend.",
                icon: "🎭",
              },
              {
                title: "Vocabulary Mapping",
                desc: "Key phrases, industry jargon, and signature expressions your brand uses regularly.",
                icon: "📝",
              },
              {
                title: "Emoji & Formatting",
                desc: "Your emoji usage patterns, capitalisation style, and formatting preferences.",
                icon: "✨",
              },
              {
                title: "Hashtag Strategy",
                desc: "Frequently used hashtags, including local SA tags like #Mzansi, #LocalIsLekker, and city-specific tags.",
                icon: "#️⃣",
              },
              {
                title: "Content Length",
                desc: "Average post length per platform to match your established patterns.",
                icon: "📏",
              },
              {
                title: "Posting Cadence",
                desc: "When and how often you typically post, informing optimal scheduling suggestions.",
                icon: "📅",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4"
              >
                <div className="mb-2 text-xl">{item.icon}</div>
                <h3 className="text-sm font-semibold text-slate-200">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border-l-4 border-purple-500 bg-slate-800/50 p-4">
            <p className="text-sm font-semibold text-purple-300">💡 Tip</p>
            <p className="mt-1 text-sm text-slate-400">
              You can update your brand profile at any time from Settings →
              Brand Profile. The AI will re-analyse your latest posts and adjust
              accordingly. We recommend refreshing every 3 months to keep your
              voice profile current.
            </p>
          </div>
        </section>

        {/* ── Content Types ── */}
        <section id="content-types">
          <h2 className="mb-4 text-xl font-bold text-white">Content Types</h2>
          <p className="mb-6 text-slate-300">
            Our AI can generate several types of social media content, each
            optimised for different platforms and objectives:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Content Type
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Platforms
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Credits
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {[
                  {
                    type: "Text Posts",
                    platforms: "All",
                    credits: "1",
                    desc: "Standard text-based social media posts with hashtags",
                  },
                  {
                    type: "Image Captions",
                    platforms: "Instagram, Facebook, LinkedIn",
                    credits: "1",
                    desc: "Engaging captions to pair with your images or photos",
                  },
                  {
                    type: "Hashtag Suggestions",
                    platforms: "All",
                    credits: "0.5",
                    desc: "Curated hashtag sets including trending and SA-local tags",
                  },
                  {
                    type: "Thread / Carousel",
                    platforms: "X, LinkedIn, Instagram",
                    credits: "2",
                    desc: "Multi-part content for threads or carousel slides",
                  },
                  {
                    type: "Video Captions",
                    platforms: "TikTok, Instagram Reels",
                    credits: "1",
                    desc: "Short-form video captions with hooks and CTAs",
                  },
                  {
                    type: "Poll / Question",
                    platforms: "X, LinkedIn, Facebook",
                    credits: "0.5",
                    desc: "Engagement-driving polls and discussion questions",
                  },
                ].map((row) => (
                  <tr
                    key={row.type}
                    className="transition-colors hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {row.type}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {row.platforms}
                    </td>
                    <td className="px-4 py-3 text-purple-400">{row.credits}</td>
                    <td className="px-4 py-3 text-slate-400">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── South African Context ── */}
        <section id="sa-context">
          <h2 className="mb-4 text-xl font-bold text-white">
            South African Context
          </h2>
          <p className="mb-4 text-slate-300">
            Purple Glow Social is built for Mzansi. Our AI understands South
            African culture, languages, and expressions — making your content
            feel authentically local.
          </p>

          <div className="space-y-4">
            {/* Languages */}
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">
                🌍 11 Official Languages
              </h3>
              <p className="mb-3 text-sm text-slate-400">
                Generate content in any of South Africa&apos;s official
                languages:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "English",
                  "Afrikaans",
                  "isiZulu",
                  "isiXhosa",
                  "Sepedi",
                  "Setswana",
                  "Sesotho",
                  "Xitsonga",
                  "siSwati",
                  "Tshivenḓa",
                  "isiNdebele",
                ].map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full border border-slate-600 bg-slate-700/50 px-3 py-1 text-xs text-slate-300"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            {/* Local Slang */}
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">
                🗣️ Local Expressions & Slang
              </h3>
              <p className="mb-3 text-sm text-slate-400">
                The AI naturally incorporates South African expressions when
                they fit your brand voice:
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { term: "Lekker", meaning: "Great, awesome, enjoyable" },
                  { term: "Eish", meaning: "Expression of surprise or frustration" },
                  { term: "Braai", meaning: "Barbecue — a core SA social event" },
                  { term: "Howzit", meaning: "Hello, how are you?" },
                  { term: "Sharp sharp", meaning: "All good, understood" },
                  { term: "Bru / Boet", meaning: "Friend, mate" },
                ].map((item) => (
                  <div key={item.term} className="text-sm">
                    <span className="font-medium text-purple-300">
                      {item.term}
                    </span>
                    <span className="text-slate-500"> — {item.meaning}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SA Hashtags */}
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">
                #️⃣ SA Hashtags
              </h3>
              <p className="mb-3 text-sm text-slate-400">
                Automatically suggested local hashtags based on your content and
                location:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "#Mzansi",
                  "#LocalIsLekker",
                  "#ProudlySA",
                  "#Joburg",
                  "#CapeTown",
                  "#Durban",
                  "#SouthAfrica",
                  "#MadeInSA",
                  "#SABusiness",
                  "#SupportLocal",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-medium text-purple-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Tips for Better Content ── */}
        <section id="tips">
          <h2 className="mb-4 text-xl font-bold text-white">
            Tips for Better AI Content
          </h2>

          <div className="space-y-3">
            {[
              {
                title: "Be specific with your prompts",
                desc: 'Instead of "write a post about our product", try "write a casual Instagram post announcing our 20% Heritage Day sale on biltong hampers, targeting young professionals in Joburg".',
              },
              {
                title: "Provide context",
                desc: "Mention current events, seasons (remember SA seasons are opposite to the northern hemisphere), or local holidays for more relevant content.",
              },
              {
                title: "Specify your audience",
                desc: "Tell the AI who you're targeting — small business owners, Gen Z consumers, corporate professionals, etc.",
              },
              {
                title: "Use the regenerate button",
                desc: "Not happy with the first result? Hit regenerate for alternative versions. Each regeneration uses 1 credit.",
              },
              {
                title: "Build on what works",
                desc: "Check your Analytics dashboard to see which AI-generated posts performed best, then use similar prompts and styles.",
              },
              {
                title: "Mix languages naturally",
                desc: "South African audiences respond well to code-switching. Ask the AI to mix English with isiZulu or Afrikaans for authentic local flavour.",
              },
            ].map((tip) => (
              <div
                key={tip.title}
                className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4"
              >
                <h3 className="mb-1 text-sm font-semibold text-slate-200">
                  ✦ {tip.title}
                </h3>
                <p className="text-sm text-slate-400">{tip.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Editing AI Suggestions ── */}
        <section id="editing">
          <h2 className="mb-4 text-xl font-bold text-white">
            Editing &amp; Customising AI Suggestions
          </h2>
          <p className="mb-4 text-slate-300">
            AI-generated content is a starting point, not the final product.
            Every suggestion can be fully customised before publishing:
          </p>

          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">✦</span>
                <span>
                  <strong className="text-slate-200">Edit text directly</strong>{" "}
                  — Click anywhere in the generated content to modify wording,
                  add personal touches, or remove sections.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">✦</span>
                <span>
                  <strong className="text-slate-200">Adjust hashtags</strong> —
                  Add, remove, or reorder suggested hashtags. Drag to rearrange
                  priority.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">✦</span>
                <span>
                  <strong className="text-slate-200">Change tone</strong> — Use
                  the tone slider to make content more formal or casual without
                  regenerating.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">✦</span>
                <span>
                  <strong className="text-slate-200">
                    Platform-specific tweaks
                  </strong>{" "}
                  — Adjust content length and formatting for each target
                  platform independently.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">✦</span>
                <span>
                  <strong className="text-slate-200">Save as template</strong>{" "}
                  — Save successful post formats as reusable templates for
                  future content.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* ── Credit Usage ── */}
        <section id="credits">
          <h2 className="mb-4 text-xl font-bold text-white">Credit Usage</h2>
          <p className="mb-4 text-slate-300">
            AI content generation uses credits from your monthly allowance. Each
            plan includes a set number of credits that reset on your billing
            date.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Credits Used
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {[
                  { action: "Generate a text post", credits: "1 credit" },
                  { action: "Generate an image caption", credits: "1 credit" },
                  { action: "Generate hashtag suggestions", credits: "0.5 credits" },
                  { action: "Generate a thread / carousel", credits: "2 credits" },
                  { action: "Generate a video caption", credits: "1 credit" },
                  { action: "Generate a poll / question", credits: "0.5 credits" },
                  { action: "Regenerate content", credits: "1 credit" },
                  { action: "Brand voice analysis (initial)", credits: "Free" },
                  { action: "Brand voice refresh", credits: "2 credits" },
                ].map((row) => (
                  <tr
                    key={row.action}
                    className="transition-colors hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 text-slate-300">{row.action}</td>
                    <td className="px-4 py-3 font-medium text-purple-400">
                      {row.credits}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { plan: "Hustler", credits: "10", price: "Free" },
              { plan: "Growler", credits: "100", price: "Included" },
              { plan: "Mogul", credits: "500", price: "Included" },
            ].map((tier) => (
              <div
                key={tier.plan}
                className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4 text-center"
              >
                <p className="text-sm font-semibold text-slate-200">
                  {tier.plan}
                </p>
                <p className="mt-1 text-2xl font-bold text-purple-400">
                  {tier.credits}
                </p>
                <p className="text-xs text-slate-500">credits/month</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border-l-4 border-purple-500 bg-slate-800/50 p-4">
            <p className="text-sm font-semibold text-purple-300">💡 Tip</p>
            <p className="mt-1 text-sm text-slate-400">
              Need more credits? Growler and Mogul subscribers can purchase
              additional credit packs from Settings → Billing. Credits expire at
              the end of your billing cycle and do not roll over.
            </p>
          </div>
        </section>
      </div>

      {/* Sidebar: Table of Contents */}
      <TableOfContents sections={TOC_SECTIONS} className="w-48 shrink-0" />
    </div>
  );
}
