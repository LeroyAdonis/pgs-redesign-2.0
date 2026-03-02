/**
 * Billing FAQ — /docs/billing-faq
 *
 * FAQ-format guide with expandable sections covering plans, pricing,
 * credits, payments (ZAR), upgrades/downgrades, refunds, and invoices.
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
  const t = await getTranslations({ locale, namespace: "docs.billingFaq" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

/* ─── Table of Contents ─── */

const TOC_SECTIONS: TocSection[] = [
  { id: "overview", title: "Overview" },
  { id: "plans-pricing", title: "Plans & Pricing" },
  { id: "credits", title: "Credits" },
  { id: "payments", title: "Payments" },
  { id: "upgrades-downgrades", title: "Upgrades & Downgrades" },
  { id: "refunds", title: "Refunds" },
  { id: "invoices", title: "Invoices" },
];

/* ─── FAQ Data ─── */

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  id: string;
  title: string;
  icon: string;
  items: FaqItem[];
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "plans-pricing",
    title: "Plans & Pricing",
    icon: "💳",
    items: [
      {
        question: "What plans are available?",
        answer:
          "We offer three plans: Hustler (free), Growler, and Mogul. Each plan includes different limits for connected accounts, AI credits, and features. The Hustler plan is free forever and perfect for getting started. Growler suits growing businesses, and Mogul provides enterprise-grade features including API access.",
      },
      {
        question: "How much do the paid plans cost?",
        answer:
          "All prices are in South African Rand (ZAR). Growler is billed monthly or annually (with a discount for annual billing). Mogul is our premium tier with custom pricing for larger teams. Visit our Pricing page for current rates.",
      },
      {
        question: "Is there a free trial for paid plans?",
        answer:
          "Yes! Both Growler and Mogul offer a 14-day free trial with full access to all features. No credit card required to start your trial. You can downgrade to Hustler at any time if you decide not to continue.",
      },
      {
        question: "Are prices displayed in ZAR?",
        answer:
          "Yes, all prices are displayed and billed in South African Rand (ZAR / R). We are a proudly South African platform and price our services locally to keep them accessible for SA businesses.",
      },
      {
        question: "Do you offer discounts for annual billing?",
        answer:
          "Yes! Annual billing saves you approximately 20% compared to monthly billing. The discount is applied automatically when you select annual billing during signup or upgrade.",
      },
      {
        question: "Do you offer discounts for NGOs or educational institutions?",
        answer:
          "Yes, we offer special pricing for registered South African NGOs, NPOs, and educational institutions. Contact our support team with your registration documents to apply for a discount.",
      },
    ],
  },
  {
    id: "credits",
    title: "Credits",
    icon: "⚡",
    items: [
      {
        question: "What are AI credits?",
        answer:
          "AI credits are the currency used for AI-powered content generation. Each generation action (creating a post, generating hashtags, etc.) consumes a certain number of credits. Your plan includes a monthly credit allowance that resets on your billing date.",
      },
      {
        question: "How many credits does each action cost?",
        answer:
          "Standard text posts and image captions cost 1 credit each. Hashtag suggestions and polls cost 0.5 credits. Thread/carousel content costs 2 credits. Regenerating content costs 1 credit. Your initial brand voice analysis is free.",
      },
      {
        question: "What happens when I run out of credits?",
        answer:
          "When your credits are exhausted, you can still schedule and publish content manually — you just won't be able to use AI generation until your credits reset on your next billing date. Growler and Mogul subscribers can purchase additional credit packs.",
      },
      {
        question: "Do unused credits roll over to the next month?",
        answer:
          "No, unused credits expire at the end of each billing cycle and do not roll over. We recommend using your full allowance each month to get maximum value from your plan.",
      },
      {
        question: "Can I purchase additional credits?",
        answer:
          "Yes, Growler and Mogul subscribers can purchase additional credit packs from Settings → Billing. Credit packs are available in bundles of 50, 100, and 250 credits. Purchased credits also expire at the end of your billing cycle.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    icon: "💰",
    items: [
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept Visa, Mastercard, and American Express credit and debit cards. We also support EFT (Electronic Funds Transfer) for annual billing, and SnapScan for mobile payments. All transactions are processed securely in South African Rand (ZAR).",
      },
      {
        question: "Is my payment information secure?",
        answer:
          "Absolutely. We use industry-standard PCI DSS-compliant payment processing. We never store your full card details on our servers — all payment data is handled by our certified payment provider.",
      },
      {
        question: "When am I billed?",
        answer:
          "Monthly plans are billed on the same date each month (the date you first subscribed). Annual plans are billed once per year on your subscription anniversary. You'll receive an email reminder 3 days before each billing date.",
      },
      {
        question: "What currency are payments processed in?",
        answer:
          "All payments are processed in South African Rand (ZAR / R). Your bank statement will show the charge from \"Purple Glow Technologies (Pty) Ltd\".",
      },
      {
        question: "What happens if my payment fails?",
        answer:
          "If a payment fails, we'll retry automatically after 3 days. You'll receive email notifications about the failed payment. If payment isn't resolved within 14 days, your account will be downgraded to the Hustler (free) plan. Your data and content are preserved for 30 days.",
      },
    ],
  },
  {
    id: "upgrades-downgrades",
    title: "Upgrades & Downgrades",
    icon: "🔄",
    items: [
      {
        question: "How do I upgrade my plan?",
        answer:
          "Go to Settings → Billing → Change Plan. Select your desired plan and complete the payment. Upgrades take effect immediately — you'll get instant access to additional features and credits (pro-rated for the remaining billing period).",
      },
      {
        question: "How do I downgrade my plan?",
        answer:
          "Go to Settings → Billing → Change Plan and select a lower tier. Downgrades take effect at the end of your current billing period. You'll retain access to your current plan's features until then.",
      },
      {
        question: "What happens to my data if I downgrade?",
        answer:
          "Your data is never deleted when downgrading. However, if you exceed the lower plan's limits (e.g., more connected accounts than allowed), you'll need to disconnect some accounts. Existing scheduled posts will still be published.",
      },
      {
        question: "Can I switch between monthly and annual billing?",
        answer:
          "Yes! Go to Settings → Billing → Billing Cycle. Switching to annual billing applies the 20% discount from your next billing date. Switching to monthly takes effect when your annual period ends.",
      },
    ],
  },
  {
    id: "refunds",
    title: "Refunds",
    icon: "↩️",
    items: [
      {
        question: "What is your refund policy?",
        answer:
          "We offer a full refund within the first 14 days of any paid subscription (this aligns with the South African Consumer Protection Act). After 14 days, refunds are provided on a pro-rata basis for the unused portion of your subscription.",
      },
      {
        question: "How do I request a refund?",
        answer:
          "Contact our support team at support@purpleglow.co.za with your account email and reason for the refund request. We process refund requests within 5 business days.",
      },
      {
        question: "Are credit pack purchases refundable?",
        answer:
          "Credit pack purchases are refundable if no credits from the pack have been used. Once credits are consumed, the pack purchase is non-refundable. Unused credits from packs expire at the end of your billing cycle.",
      },
      {
        question: "How long does it take to receive a refund?",
        answer:
          "Once approved, refunds are processed within 5–10 business days. The time for the refund to appear in your account depends on your bank, typically 3–5 additional business days for South African banks.",
      },
    ],
  },
  {
    id: "invoices",
    title: "Invoices",
    icon: "🧾",
    items: [
      {
        question: "Where can I find my invoices?",
        answer:
          "All invoices are available in Settings → Billing → Invoice History. You can view, download (PDF), or email invoices to any address. Invoices are generated automatically after each successful payment.",
      },
      {
        question: "Do invoices include VAT?",
        answer:
          "Yes, all invoices include 15% South African Value Added Tax (VAT) as required by SARS. Our VAT registration number is displayed on every invoice. Prices shown on the Pricing page are inclusive of VAT.",
      },
      {
        question: "Can I add my company details to invoices?",
        answer:
          "Yes! Go to Settings → Billing → Company Details and add your company name, registration number, VAT number, and billing address. These details will appear on all future invoices and can be retroactively applied to previous invoices.",
      },
      {
        question: "Can I receive invoices via email automatically?",
        answer:
          "Yes, we send invoice emails automatically after each payment. You can add additional email recipients (e.g., your accountant) in Settings → Billing → Invoice Recipients.",
      },
    ],
  },
];

/* ─── Page ─── */

export default async function BillingFaqPage({ params }: Props) {
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
            { label: t("billingFaq.title") },
          ]}
          className="mb-8"
        />

        {/* Header */}
        <header id="overview">
          <h1 className="mb-3 text-3xl font-bold text-white">
            {t("billingFaq.title")}
          </h1>
          <p className="text-lg text-slate-400">
            {t("billingFaq.description")}. All prices are in South African Rand
            (ZAR). Find answers to common billing questions below.
          </p>
        </header>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-2">
          {FAQ_CATEGORIES.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-purple-500/40 hover:text-purple-300"
            >
              <span>{category.icon}</span>
              {category.title}
            </a>
          ))}
        </div>

        {/* FAQ Categories */}
        {FAQ_CATEGORIES.map((category) => (
          <section key={category.id} id={category.id}>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
              <span>{category.icon}</span>
              {category.title}
            </h2>

            <div className="space-y-2">
              {category.items.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-lg border border-slate-700/50 bg-slate-800/50 transition-colors hover:bg-slate-800"
                >
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-slate-200 [&::-webkit-details-marker]:hidden">
                    <span>{faq.question}</span>
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 6l4 4 4-4"
                      />
                    </svg>
                  </summary>
                  <div className="border-t border-slate-700/30 px-4 py-3 text-sm leading-relaxed text-slate-400">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

        {/* Contact support */}
        <section className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
          <h2 className="mb-2 text-lg font-bold text-white">
            Still have questions?
          </h2>
          <p className="mb-4 text-sm text-slate-400">
            Can&apos;t find the answer you&apos;re looking for? Our support team
            is here to help.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-3">
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-medium text-purple-400">
                support@purpleglow.co.za
              </p>
            </div>
            <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-3">
              <p className="text-xs text-slate-500">Response Time</p>
              <p className="text-sm font-medium text-slate-200">
                Within 24 hours (business days)
              </p>
            </div>
            <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-3">
              <p className="text-xs text-slate-500">Business Hours</p>
              <p className="text-sm font-medium text-slate-200">
                Mon–Fri, 08:00–17:00 SAST
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Sidebar: Table of Contents */}
      <TableOfContents sections={TOC_SECTIONS} className="w-48 shrink-0" />
    </div>
  );
}
