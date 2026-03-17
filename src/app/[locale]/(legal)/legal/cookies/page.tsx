/**
 * Cookie Policy page — /legal/cookies
 *
 * Details how Purple Glow Social uses cookies and similar technologies.
 * Includes POPIA cookie consent requirements.
 * Public page, no auth required.
 */

import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  void locale;
  const t = await getTranslations("legal");
  return {
    title: t("cookies.title"),
    description: t("cookies.description"),
  };
}

type Props = {
  params: Promise<{ locale: string }>;
};

/* ─── Reusable sub-components for legal prose ─── */

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="mb-4 mt-10 scroll-mt-24 text-xl font-semibold text-white first:mt-0"
    >
      {children}
    </h2>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 leading-relaxed text-slate-300">{children}</p>;
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mb-4 list-disc space-y-1.5 pl-6 text-slate-300">
      {items.map((item, i) => (
        <li key={i} className="leading-relaxed">
          {item}
        </li>
      ))}
    </ul>
  );
}

function Divider() {
  return <hr className="my-8 border-slate-700" />;
}

/* ─── Cookie categories table data ─── */

type CookieCategory = {
  category: string;
  purpose: string;
  examples: string;
  duration: string;
  required: boolean;
};

const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    category: "Essential",
    purpose:
      "Required for the platform to function. These cookies enable core functionality such as authentication, session management, and security features.",
    examples: "Session ID, CSRF token, authentication state, locale preference",
    duration: "Session to 30 days",
    required: true,
  },
  {
    category: "Functional",
    purpose:
      "Enable enhanced functionality and personalisation, such as remembering your preferences, dashboard layout, and theme settings.",
    examples:
      "Dashboard layout preferences, content editor settings, timezone selection",
    duration: "Up to 12 months",
    required: false,
  },
  {
    category: "Analytics",
    purpose:
      "Help us understand how visitors interact with the platform by collecting anonymous usage data. This information is used to improve our Service.",
    examples:
      "Page views, feature usage patterns, session duration, navigation paths",
    duration: "Up to 24 months",
    required: false,
  },
  {
    category: "Marketing",
    purpose:
      "Used to track visitors across platforms and display relevant advertisements. These cookies may be set by our advertising partners.",
    examples:
      "Ad tracking identifiers, conversion pixels, remarketing tags",
    duration: "Up to 24 months",
    required: false,
  },
];

export default async function CookiePolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("legal");

  return (
    <article className="prose prose-invert max-w-none">
      {/* Back link */}
      <a
        href={`/${locale}/legal`}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-purple-400 no-underline transition-colors hover:text-purple-300"
      >
        ← {t("backToLegal")}
      </a>

      {/* Page title */}
      <h1 className="mb-2 text-3xl font-bold text-white">
        {t("cookies.title")}
      </h1>
      <p className="mb-8 text-sm text-slate-500">
        {t("lastUpdated")}: March 2026
      </p>

      {/* ─── 1. What Are Cookies ─── */}
      <SectionHeading id="what-are-cookies">
        1. What Are Cookies
      </SectionHeading>
      <Paragraph>
        Cookies are small text files that are placed on your device (computer, tablet,
        or mobile phone) when you visit a website. They are widely used to make
        websites work more efficiently, provide a better user experience, and give
        website owners useful information about how their site is used.
      </Paragraph>
      <Paragraph>
        Purple Glow Social (Pty) Ltd (&quot;we&quot;, &quot;us&quot;, or
        &quot;our&quot;) uses cookies and similar technologies (such as local storage
        and session storage) on our AI-powered social media management platform. This
        Cookie Policy explains what cookies we use, why we use them, and how you can
        manage your preferences.
      </Paragraph>

      <Divider />

      {/* ─── 2. How We Use Cookies ─── */}
      <SectionHeading id="how-we-use-cookies">
        2. How We Use Cookies
      </SectionHeading>
      <Paragraph>We use cookies for the following purposes:</Paragraph>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Authentication &amp; security:</strong>{" "}
            to verify your identity, maintain your session, and protect against
            cross-site request forgery (CSRF) attacks.
          </>,
          <>
            <strong className="text-slate-100">Preferences:</strong> to remember your
            settings, such as language preference, timezone (SAST / UTC+2), theme, and
            dashboard layout.
          </>,
          <>
            <strong className="text-slate-100">Analytics:</strong> to understand how
            users interact with our platform, which features are most popular, and
            where we can improve.
          </>,
          <>
            <strong className="text-slate-100">Performance:</strong> to monitor
            platform performance and ensure a smooth user experience.
          </>,
        ]}
      />

      <Divider />

      {/* ─── 3. Types of Cookies We Use ─── */}
      <SectionHeading id="types-of-cookies">
        3. Types of Cookies We Use
      </SectionHeading>
      <Paragraph>
        The following table provides details about the categories of cookies used on
        our platform:
      </Paragraph>

      {/* Cookie categories table */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-600 text-left">
              <th className="px-3 py-3 font-semibold text-white">Category</th>
              <th className="px-3 py-3 font-semibold text-white">Purpose</th>
              <th className="px-3 py-3 font-semibold text-white">Examples</th>
              <th className="px-3 py-3 font-semibold text-white">Duration</th>
              <th className="px-3 py-3 font-semibold text-white">Required</th>
            </tr>
          </thead>
          <tbody>
            {COOKIE_CATEGORIES.map((cookie, i) => (
              <tr
                key={cookie.category}
                className={`border-b border-slate-800 ${
                  i % 2 === 0 ? "bg-slate-900/30" : "bg-slate-900/60"
                }`}
              >
                <td className="px-3 py-3 font-medium text-slate-200">
                  {cookie.category}
                </td>
                <td className="px-3 py-3 text-slate-300">{cookie.purpose}</td>
                <td className="px-3 py-3 text-slate-400">{cookie.examples}</td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-400">
                  {cookie.duration}
                </td>
                <td className="px-3 py-3 text-center">
                  {cookie.required ? (
                    <span className="text-green-400">Yes</span>
                  ) : (
                    <span className="text-slate-500">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Divider />

      {/* ─── 4. Third-Party Cookies ─── */}
      <SectionHeading id="third-party-cookies">
        4. Third-Party Cookies
      </SectionHeading>
      <Paragraph>
        In addition to our own cookies, we may use cookies set by third-party services
        that we integrate with. These third parties include:
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Authentication providers:</strong>{" "}
            Google OAuth and other social login providers may set cookies during the
            sign-in process.
          </>,
          <>
            <strong className="text-slate-100">Analytics services:</strong> we may use
            analytics platforms to understand usage patterns. These services set their
            own cookies and are governed by their respective privacy policies.
          </>,
          <>
            <strong className="text-slate-100">Social media platforms:</strong> when
            you connect your social media accounts (Meta/Facebook, Instagram,
            X/Twitter, LinkedIn), these platforms may set cookies on your device.
          </>,
          <>
            <strong className="text-slate-100">Payment processors:</strong> our
            payment providers may set cookies during the checkout and billing process.
          </>,
        ]}
      />
      <Paragraph>
        We do not control cookies set by third parties. We recommend reviewing the
        privacy and cookie policies of these third-party services directly.
      </Paragraph>

      <Divider />

      {/* ─── 5. Managing Your Cookie Preferences ─── */}
      <SectionHeading id="managing-cookies">
        5. Managing Your Cookie Preferences
      </SectionHeading>
      <Paragraph>
        You have several options for managing cookies:
      </Paragraph>

      <h3 className="mb-2 mt-6 text-lg font-medium text-slate-100">
        5.1 Browser Settings
      </h3>
      <Paragraph>
        Most web browsers allow you to control cookies through their settings. You can
        typically find these options in your browser&apos;s &quot;Settings&quot;,
        &quot;Preferences&quot;, or &quot;Privacy&quot; menu. You can:
      </Paragraph>
      <BulletList
        items={[
          "View and delete existing cookies.",
          "Block all cookies or only third-party cookies.",
          "Set your browser to notify you when a cookie is being set.",
          "Configure exceptions for specific websites.",
        ]}
      />

      <h3 className="mb-2 mt-6 text-lg font-medium text-slate-100">
        5.2 Platform Settings
      </h3>
      <Paragraph>
        When you first visit our platform, you will be presented with a cookie consent
        banner that allows you to accept or decline non-essential cookies. You can
        update your preferences at any time through your account settings.
      </Paragraph>

      <h3 className="mb-2 mt-6 text-lg font-medium text-slate-100">
        5.3 Impact of Disabling Cookies
      </h3>
      <Paragraph>
        Please note that disabling or blocking certain cookies may affect the
        functionality of our platform. Essential cookies cannot be disabled as they are
        necessary for the platform to function. If you disable functional cookies, some
        personalisation features may not work as expected.
      </Paragraph>

      <Divider />

      {/* ─── 6. POPIA Cookie Consent ─── */}
      <SectionHeading id="popia-consent">
        6. POPIA Cookie Consent
      </SectionHeading>
      <Paragraph>
        In accordance with the Protection of Personal Information Act, 2013 (Act No. 4
        of 2013) (&quot;POPIA&quot;), we obtain your consent before setting
        non-essential cookies on your device. Under POPIA:
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Essential cookies</strong> do not
            require consent as they are necessary for the legitimate purpose of
            providing our Service.
          </>,
          <>
            <strong className="text-slate-100">Non-essential cookies</strong>{" "}
            (functional, analytics, and marketing) require your explicit, informed
            consent before being set.
          </>,
          "You may withdraw your consent at any time without affecting the lawfulness of processing based on consent before its withdrawal.",
          "We record and store your consent preferences to demonstrate compliance with POPIA.",
          "Cookie consent is reviewed and refreshed every 12 months.",
        ]}
      />
      <Paragraph>
        Personal information collected through cookies is processed in accordance with
        our{" "}
        <a
          href={`/${locale}/legal/privacy`}
          className="text-purple-400 hover:text-purple-300"
        >
          Privacy Policy
        </a>
        .
      </Paragraph>

      <Divider />

      {/* ─── 7. Changes to This Policy ─── */}
      <SectionHeading id="changes">
        7. Changes to This Policy
      </SectionHeading>
      <Paragraph>
        We may update this Cookie Policy from time to time to reflect changes in the
        cookies we use, our practices, or legal requirements. When we make changes:
      </Paragraph>
      <BulletList
        items={[
          "We will update the \"Last updated\" date at the top of this page.",
          "For material changes, we will display an updated cookie consent banner so you can review and update your preferences.",
          "We encourage you to review this policy periodically.",
        ]}
      />

      <Divider />

      {/* ─── 8. Contact ─── */}
      <SectionHeading id="contact">8. Contact</SectionHeading>
      <Paragraph>
        If you have any questions about our use of cookies or this Cookie Policy,
        please contact us:
      </Paragraph>
      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-5">
        <p className="mb-1 font-medium text-white">
          Purple Glow Social (Pty) Ltd
        </p>
        <p className="text-sm text-slate-300">
          The Information Officer
        </p>
        <p className="text-sm text-slate-300">
          Email:{" "}
          <a
            href="mailto:privacy@purpleglowsocial.co.za"
            className="text-purple-400 hover:text-purple-300"
          >
            privacy@purpleglowsocial.co.za
          </a>
        </p>
        <p className="mt-3 text-sm text-slate-400">
          This policy is governed by the laws of the Republic of South Africa,
          including the Protection of Personal Information Act, 2013 (Act No. 4 of
          2013).
        </p>
      </div>
    </article>
  );
}
