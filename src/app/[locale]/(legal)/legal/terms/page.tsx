/**
 * Terms of Service page — /legal/terms
 *
 * Comprehensive Terms of Service governed by the laws of the Republic of South Africa.
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
    title: t("terms.title"),
    description: t("terms.description"),
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

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 mt-6 text-lg font-medium text-slate-100">
      {children}
    </h3>
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

export default async function TermsOfServicePage({ params }: Props) {
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
        {t("terms.title")}
      </h1>
      <p className="mb-8 text-sm text-slate-500">
        {t("lastUpdated")}: March 2026
      </p>

      {/* ─── 1. Acceptance of Terms ─── */}
      <SectionHeading id="acceptance">1. Acceptance of Terms</SectionHeading>
      <Paragraph>
        These Terms of Service (&quot;Terms&quot;) constitute a legally binding
        agreement between you (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;)
        and Purple Glow Social (Pty) Ltd (&quot;Purple Glow Social&quot;,
        &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), a company registered in
        the Republic of South Africa.
      </Paragraph>
      <Paragraph>
        By accessing or using the Purple Glow Social platform, including any
        associated websites, applications, APIs, or services (collectively, the
        &quot;Service&quot;), you agree to be bound by these Terms. If you do not agree
        to these Terms, you must not access or use the Service.
      </Paragraph>
      <Paragraph>
        These Terms should be read together with our{" "}
        <a
          href={`/${locale}/legal/privacy`}
          className="text-purple-400 hover:text-purple-300"
        >
          Privacy Policy
        </a>
        ,{" "}
        <a
          href={`/${locale}/legal/cookies`}
          className="text-purple-400 hover:text-purple-300"
        >
          Cookie Policy
        </a>
        , and{" "}
        <a
          href={`/${locale}/legal/acceptable-use`}
          className="text-purple-400 hover:text-purple-300"
        >
          Acceptable Use Policy
        </a>
        .
      </Paragraph>

      <Divider />

      {/* ─── 2. Eligibility ─── */}
      <SectionHeading id="eligibility">2. Eligibility</SectionHeading>
      <Paragraph>
        You must be at least 18 years of age and have the legal capacity to enter into
        a binding agreement to use our Service. By using the Service, you represent and
        warrant that you meet these requirements.
      </Paragraph>
      <Paragraph>
        If you are using the Service on behalf of a business, organisation, or other
        legal entity, you represent that you have the authority to bind that entity to
        these Terms, and &quot;you&quot; shall refer to that entity.
      </Paragraph>

      <Divider />

      {/* ─── 3. Account Registration ─── */}
      <SectionHeading id="account-registration">
        3. Account Registration
      </SectionHeading>
      <Paragraph>
        To access certain features of the Service, you must create an account. When
        registering, you agree to:
      </Paragraph>
      <BulletList
        items={[
          "Provide accurate, current, and complete information during registration.",
          "Maintain and promptly update your account information to keep it accurate.",
          "Maintain the security and confidentiality of your login credentials.",
          "Accept responsibility for all activities that occur under your account.",
          "Notify us immediately of any unauthorised use of your account.",
        ]}
      />
      <Paragraph>
        We reserve the right to suspend or terminate accounts that contain inaccurate
        information or violate these Terms.
      </Paragraph>

      <Divider />

      {/* ─── 4. Service Description ─── */}
      <SectionHeading id="service-description">
        4. Service Description
      </SectionHeading>
      <Paragraph>
        Purple Glow Social is an AI-powered social media management platform that
        enables users to:
      </Paragraph>
      <BulletList
        items={[
          "Connect and manage multiple social media accounts from a single dashboard.",
          "Generate AI-powered content suggestions, captions, and post recommendations using artificial intelligence.",
          "Schedule and publish content across connected social media platforms.",
          "Analyse post performance through analytics dashboards and insights.",
          "Manage brand profiles, voice settings, and content strategies.",
          "Collaborate with team members on content creation and approval workflows.",
        ]}
      />
      <Paragraph>
        We reserve the right to modify, suspend, or discontinue any part of the
        Service at any time, with reasonable notice where practicable. We shall not be
        liable to you or any third party for any modification, suspension, or
        discontinuation of the Service.
      </Paragraph>

      <Divider />

      {/* ─── 5. User Content & Intellectual Property ─── */}
      <SectionHeading id="user-content">
        5. User Content &amp; Intellectual Property
      </SectionHeading>

      <SubHeading>5.1 Your Content</SubHeading>
      <Paragraph>
        You retain all ownership rights in the content you create, upload, or publish
        through the Service (&quot;User Content&quot;). By using the Service, you grant
        us a limited, non-exclusive, worldwide licence to host, store, transmit, and
        display your User Content solely for the purpose of providing the Service to
        you. This licence terminates when you delete your content or close your
        account.
      </Paragraph>

      <SubHeading>5.2 Our Intellectual Property</SubHeading>
      <Paragraph>
        The Service, including its design, features, code, branding, trademarks,
        logos, and all related intellectual property, is owned by Purple Glow Social
        (Pty) Ltd and is protected by South African and international intellectual
        property laws. You may not copy, modify, distribute, sell, or lease any part of
        the Service without our prior written consent.
      </Paragraph>

      <SubHeading>5.3 Feedback</SubHeading>
      <Paragraph>
        If you provide us with feedback, suggestions, or ideas regarding the Service,
        you grant us an unrestricted, irrevocable licence to use such feedback for any
        purpose without obligation or compensation to you.
      </Paragraph>

      <Divider />

      {/* ─── 6. AI-Generated Content ─── */}
      <SectionHeading id="ai-content">
        6. AI-Generated Content
      </SectionHeading>
      <Paragraph>
        Our Service uses artificial intelligence to generate content suggestions,
        including captions, hashtags, images, and post ideas. Regarding AI-generated
        content:
      </Paragraph>
      <BulletList
        items={[
          "AI-generated suggestions are provided for your consideration only. You are responsible for reviewing, editing, and approving all content before publication.",
          "We do not guarantee the accuracy, completeness, originality, or appropriateness of AI-generated content.",
          "You are solely responsible for ensuring that any content you publish complies with applicable laws, platform policies, and third-party rights.",
          "AI-generated content may occasionally produce unexpected, inaccurate, or inappropriate results. You should always exercise editorial judgment.",
          "Intellectual property rights in AI-generated content shall vest in you upon publication, subject to any third-party rights.",
        ]}
      />

      <Divider />

      {/* ─── 7. Prohibited Conduct ─── */}
      <SectionHeading id="prohibited-conduct">
        7. Prohibited Conduct
      </SectionHeading>
      <Paragraph>
        You agree not to use the Service to:
      </Paragraph>
      <BulletList
        items={[
          "Violate any applicable laws of the Republic of South Africa or any other jurisdiction.",
          "Infringe upon the intellectual property rights of any third party.",
          "Transmit spam, unsolicited advertising, or deceptive content.",
          "Engage in harassment, hate speech, or discrimination as defined by the South African Constitution and the Promotion of Equality and Prevention of Unfair Discrimination Act.",
          "Impersonate any person, business, or entity.",
          "Upload malware, viruses, or any harmful code.",
          "Attempt to gain unauthorised access to the Service or its infrastructure.",
          "Scrape, crawl, or harvest data from the Service without authorisation.",
          "Circumvent any security features, rate limits, or access controls.",
          "Use the Service in any manner that could damage, disable, or impair its functionality.",
        ]}
      />
      <Paragraph>
        For full details, please refer to our{" "}
        <a
          href={`/${locale}/legal/acceptable-use`}
          className="text-purple-400 hover:text-purple-300"
        >
          Acceptable Use Policy
        </a>
        .
      </Paragraph>

      <Divider />

      {/* ─── 8. Credits & Billing ─── */}
      <SectionHeading id="credits-billing">
        8. Credits &amp; Billing
      </SectionHeading>
      <Paragraph>
        Certain features of the Service require credits. Credits are consumed when
        generating AI content, scheduling posts, or using premium features. Credit
        usage varies by feature and subscription tier.
      </Paragraph>
      <BulletList
        items={[
          "Credits are non-transferable and cannot be exchanged for cash.",
          "Unused credits do not roll over between billing periods unless specified by your subscription plan.",
          "All prices are displayed in South African Rand (ZAR) unless otherwise stated.",
          "We reserve the right to adjust pricing with 30 days' prior notice.",
          "You are responsible for all applicable taxes, including VAT at the prevailing rate.",
        ]}
      />

      <Divider />

      {/* ─── 9. Subscription Tiers ─── */}
      <SectionHeading id="subscriptions">
        9. Subscription Tiers
      </SectionHeading>
      <Paragraph>
        Purple Glow Social offers multiple subscription tiers, each with different
        features, credit allocations, and usage limits. Details of current subscription
        tiers, pricing, and included features are available on our pricing page.
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Free tier:</strong> limited access to
            core features with a monthly credit allocation.
          </>,
          <>
            <strong className="text-slate-100">Paid tiers:</strong> enhanced features,
            increased credit allocations, priority support, and additional
            functionality as described on the pricing page.
          </>,
        ]}
      />
      <Paragraph>
        Subscriptions are billed on a recurring basis (monthly or annually) unless
        cancelled. You authorise us to charge your designated payment method for
        recurring fees.
      </Paragraph>

      <Divider />

      {/* ─── 10. Cancellation & Refunds ─── */}
      <SectionHeading id="cancellation">
        10. Cancellation &amp; Refunds
      </SectionHeading>
      <Paragraph>
        You may cancel your subscription at any time through your account settings.
        Upon cancellation:
      </Paragraph>
      <BulletList
        items={[
          "Your subscription remains active until the end of the current billing period.",
          "You will not be charged for subsequent billing periods.",
          "Unused credits expire at the end of the billing period.",
          "Your data will be retained for 30 days after account closure to allow for reactivation, after which it will be permanently deleted.",
        ]}
      />
      <Paragraph>
        Refunds are handled in accordance with the South African Consumer Protection
        Act, 2008 (Act No. 68 of 2008). If you believe you are entitled to a refund,
        please contact our support team.
      </Paragraph>

      <Divider />

      {/* ─── 11. Limitation of Liability ─── */}
      <SectionHeading id="liability">
        11. Limitation of Liability
      </SectionHeading>
      <Paragraph>
        To the maximum extent permitted by South African law:
      </Paragraph>
      <BulletList
        items={[
          "The Service is provided \"as is\" and \"as available\" without warranties of any kind, whether express or implied.",
          "We do not warrant that the Service will be uninterrupted, error-free, or secure.",
          "We shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.",
          "Our total liability to you for any claims arising from or related to the Service shall not exceed the amount you have paid us in the 12 months preceding the claim.",
          "We are not liable for any loss or damage resulting from AI-generated content that you choose to publish.",
          "We are not liable for any actions taken by social media platforms in relation to content published through the Service.",
        ]}
      />
      <Paragraph>
        Nothing in these Terms excludes or limits liability that cannot be excluded or
        limited under South African law, including liability for fraud or gross
        negligence.
      </Paragraph>

      <Divider />

      {/* ─── 12. Indemnification ─── */}
      <SectionHeading id="indemnification">
        12. Indemnification
      </SectionHeading>
      <Paragraph>
        You agree to indemnify, defend, and hold harmless Purple Glow Social (Pty) Ltd,
        its directors, officers, employees, and agents from and against any claims,
        liabilities, damages, losses, costs, and expenses (including reasonable legal
        fees) arising from or related to:
      </Paragraph>
      <BulletList
        items={[
          "Your use of the Service.",
          "Your breach of these Terms.",
          "Your violation of any applicable law or regulation.",
          "Content you publish through the Service, including AI-assisted content.",
          "Your infringement of any third-party rights.",
        ]}
      />

      <Divider />

      {/* ─── 13. Governing Law ─── */}
      <SectionHeading id="governing-law">
        13. Governing Law
      </SectionHeading>
      <Paragraph>
        These Terms shall be governed by and construed in accordance with the laws of
        the Republic of South Africa, without regard to its conflict of law provisions.
        The application of the United Nations Convention on Contracts for the
        International Sale of Goods is expressly excluded.
      </Paragraph>

      <Divider />

      {/* ─── 14. Dispute Resolution ─── */}
      <SectionHeading id="dispute-resolution">
        14. Dispute Resolution
      </SectionHeading>
      <Paragraph>
        In the event of any dispute arising from or in connection with these Terms, the
        parties shall first attempt to resolve the dispute through good-faith
        negotiation. If the dispute cannot be resolved through negotiation within 30
        days, either party may:
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Mediation:</strong> refer the dispute
            to mediation in accordance with the rules of the Arbitration Foundation of
            Southern Africa (AFSA).
          </>,
          <>
            <strong className="text-slate-100">Litigation:</strong> institute legal
            proceedings in the High Court of South Africa, Gauteng Division, Pretoria,
            which shall have exclusive jurisdiction.
          </>,
        ]}
      />
      <Paragraph>
        Nothing in this clause prevents either party from seeking urgent interim relief
        from any court of competent jurisdiction.
      </Paragraph>

      <Divider />

      {/* ─── 15. Modifications to Terms ─── */}
      <SectionHeading id="modifications">
        15. Modifications to Terms
      </SectionHeading>
      <Paragraph>
        We reserve the right to modify these Terms at any time. When we make material
        changes:
      </Paragraph>
      <BulletList
        items={[
          "We will update the \"Last updated\" date at the top of this page.",
          "We will notify you via email or in-platform notification at least 30 days before the changes take effect.",
          "Your continued use of the Service after the effective date constitutes acceptance of the modified Terms.",
          "If you do not agree with the modifications, you must discontinue use of the Service and close your account.",
        ]}
      />

      <Divider />

      {/* ─── 16. Contact Information ─── */}
      <SectionHeading id="contact">16. Contact Information</SectionHeading>
      <Paragraph>
        For any questions or concerns regarding these Terms, please contact us:
      </Paragraph>
      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-5">
        <p className="mb-1 font-medium text-white">
          Purple Glow Social (Pty) Ltd
        </p>
        <p className="text-sm text-slate-300">
          Email:{" "}
          <a
            href="mailto:legal@purpleglowsocial.co.za"
            className="text-purple-400 hover:text-purple-300"
          >
            legal@purpleglowsocial.co.za
          </a>
        </p>
        <p className="mt-3 text-sm text-slate-400">
          These Terms are governed by the laws of the Republic of South Africa.
          Jurisdiction: High Court of South Africa, Gauteng Division, Pretoria.
        </p>
      </div>
    </article>
  );
}
