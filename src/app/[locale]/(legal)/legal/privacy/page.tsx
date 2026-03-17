/**
 * Privacy Policy page — /legal/privacy
 *
 * POPIA-compliant privacy policy for Purple Glow Social.
 * References the Protection of Personal Information Act, 2013 (Act No. 4 of 2013).
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
  void locale; // used by next-intl internally
  const t = await getTranslations("legal");
  return {
    title: t("privacy.title"),
    description: t("privacy.description"),
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

export default async function PrivacyPolicyPage({ params }: Props) {
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
        {t("privacy.title")}
      </h1>
      <p className="mb-8 text-sm text-slate-500">
        {t("lastUpdated")}: March 2026
      </p>

      {/* ─── 1. Introduction ─── */}
      <SectionHeading id="introduction">1. Introduction</SectionHeading>
      <Paragraph>
        Purple Glow Social (Pty) Ltd (&quot;Purple Glow Social&quot;, &quot;we&quot;,
        &quot;us&quot;, or &quot;our&quot;) is committed to protecting your personal
        information and respecting your privacy. This Privacy Policy explains how we
        collect, use, store, and share your personal information when you use our
        AI-powered social media management platform, in compliance with the Protection
        of Personal Information Act, 2013 (Act No. 4 of 2013) (&quot;POPIA&quot;) and
        other applicable South African legislation.
      </Paragraph>
      <Paragraph>
        By accessing or using Purple Glow Social, you acknowledge that you have read
        and understood this Privacy Policy. If you do not agree with our practices,
        please do not use our services.
      </Paragraph>

      <Divider />

      {/* ─── 2. Information We Collect ─── */}
      <SectionHeading id="information-we-collect">
        2. Information We Collect
      </SectionHeading>

      <SubHeading>2.1 Information You Provide Directly</SubHeading>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Account information:</strong> name,
            email address, and profile details when you register for an account.
          </>,
          <>
            <strong className="text-slate-100">Social media credentials:</strong>{" "}
            OAuth tokens for connected social media accounts (Instagram, Facebook,
            X/Twitter, LinkedIn). These tokens are encrypted using AES-256-GCM
            encryption and stored securely.
          </>,
          <>
            <strong className="text-slate-100">Content:</strong> posts, images,
            captions, and other content you create, schedule, or publish through our
            platform.
          </>,
          <>
            <strong className="text-slate-100">Brand profile data:</strong> brand
            voice preferences, tone settings, target audience information, and content
            guidelines you configure.
          </>,
          <>
            <strong className="text-slate-100">Payment information:</strong>{" "}
            billing details processed through our third-party payment provider. We do
            not store full credit card numbers on our servers.
          </>,
          <>
            <strong className="text-slate-100">Communications:</strong> any messages,
            feedback, or support requests you send to us.
          </>,
        ]}
      />

      <SubHeading>2.2 Information Collected Automatically</SubHeading>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Usage data:</strong> pages visited,
            features used, click patterns, and session duration.
          </>,
          <>
            <strong className="text-slate-100">Device information:</strong> browser
            type, operating system, screen resolution, and device identifiers.
          </>,
          <>
            <strong className="text-slate-100">Log data:</strong> IP addresses,
            access timestamps, and referring URLs.
          </>,
          <>
            <strong className="text-slate-100">Analytics data:</strong> social media
            post performance metrics retrieved from connected platforms.
          </>,
          <>
            <strong className="text-slate-100">Cookies and similar technologies:</strong>{" "}
            as described in our{" "}
            <a
              href={`/${locale}/legal/cookies`}
              className="text-purple-400 hover:text-purple-300"
            >
              Cookie Policy
            </a>
            .
          </>,
        ]}
      />

      <SubHeading>2.3 Information from Third Parties</SubHeading>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Social media platforms:</strong>{" "}
            profile data, follower counts, engagement metrics, and post analytics from
            connected accounts via their respective APIs.
          </>,
          <>
            <strong className="text-slate-100">Authentication providers:</strong>{" "}
            basic profile information when you sign in using Google or other OAuth
            providers.
          </>,
        ]}
      />

      <Divider />

      {/* ─── 3. How We Use Your Information ─── */}
      <SectionHeading id="how-we-use">
        3. How We Use Your Information
      </SectionHeading>
      <Paragraph>We use your personal information to:</Paragraph>
      <BulletList
        items={[
          "Provide, maintain, and improve our AI-powered social media management services.",
          "Generate AI-powered content suggestions, captions, and post recommendations tailored to your brand profile.",
          "Schedule, publish, and manage social media posts on your behalf across connected platforms.",
          "Analyse post performance and provide analytics dashboards and insights.",
          "Process payments and manage your subscription.",
          "Send service-related notifications, updates, and support communications.",
          "Detect, prevent, and address technical issues, fraud, and security threats.",
          "Comply with legal obligations under South African law, including POPIA.",
          "Improve our AI models and platform features using aggregated, anonymised data.",
        ]}
      />

      <Divider />

      {/* ─── 4. Legal Basis for Processing ─── */}
      <SectionHeading id="legal-basis">
        4. Legal Basis for Processing
      </SectionHeading>
      <Paragraph>
        Under POPIA, we process your personal information based on the following lawful
        grounds:
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Consent (Section 11(1)(a)):</strong>{" "}
            where you have given us explicit consent, such as when connecting social
            media accounts or opting in to marketing communications.
          </>,
          <>
            <strong className="text-slate-100">
              Contractual necessity (Section 11(1)(b)):
            </strong>{" "}
            processing necessary to fulfil our obligations under our Terms of Service,
            such as providing the platform services you have subscribed to.
          </>,
          <>
            <strong className="text-slate-100">
              Legal obligation (Section 11(1)(c)):
            </strong>{" "}
            processing required to comply with applicable South African laws and
            regulations.
          </>,
          <>
            <strong className="text-slate-100">
              Legitimate interest (Section 11(1)(f)):
            </strong>{" "}
            processing necessary for our legitimate interests, such as improving our
            services, preventing fraud, and ensuring platform security, provided these
            interests do not override your rights.
          </>,
        ]}
      />

      <Divider />

      {/* ─── 5. Data Sharing & Third Parties ─── */}
      <SectionHeading id="data-sharing">
        5. Data Sharing &amp; Third Parties
      </SectionHeading>
      <Paragraph>
        We do not sell your personal information. We may share your data with the
        following categories of third parties:
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Social media platforms:</strong> to
            publish content and retrieve analytics on your behalf (Meta/Facebook,
            Instagram, X/Twitter, LinkedIn).
          </>,
          <>
            <strong className="text-slate-100">AI service providers:</strong> we use
            Google Gemini for AI content generation. Prompts sent to AI services may
            include your brand profile data and content preferences, but are not used
            to train third-party models.
          </>,
          <>
            <strong className="text-slate-100">Cloud infrastructure:</strong> our
            platform is hosted on secure cloud infrastructure with appropriate data
            processing agreements in place.
          </>,
          <>
            <strong className="text-slate-100">Payment processors:</strong> to handle
            subscription billing securely.
          </>,
          <>
            <strong className="text-slate-100">Legal authorities:</strong> where
            required by law, court order, or to protect our legal rights.
          </>,
        ]}
      />
      <Paragraph>
        All third-party service providers are contractually obligated to protect your
        personal information in accordance with POPIA and are prohibited from using it
        for purposes other than those we have specified.
      </Paragraph>

      <Divider />

      {/* ─── 6. International Data Transfers ─── */}
      <SectionHeading id="international-transfers">
        6. International Data Transfers
      </SectionHeading>
      <Paragraph>
        Your personal information may be transferred to and processed in countries
        outside the Republic of South Africa, including where our cloud infrastructure
        and AI service providers operate. In accordance with Section 72 of POPIA, we
        ensure that any such transfers are subject to:
      </Paragraph>
      <BulletList
        items={[
          "Adequate data protection laws in the recipient country, or",
          "Binding contractual obligations that provide substantially similar protection to POPIA, or",
          "Your explicit consent to the transfer, or",
          "The transfer being necessary for the performance of our contract with you.",
        ]}
      />

      <Divider />

      {/* ─── 7. Data Retention ─── */}
      <SectionHeading id="data-retention">7. Data Retention</SectionHeading>
      <Paragraph>
        We retain your personal information only for as long as necessary to fulfil the
        purposes for which it was collected, or as required by law:
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Account data:</strong> retained for the
            duration of your account and for 30 days after deletion to allow for
            account recovery.
          </>,
          <>
            <strong className="text-slate-100">Content and post data:</strong>{" "}
            retained while your account is active. Deleted content is purged within 30
            days.
          </>,
          <>
            <strong className="text-slate-100">OAuth tokens:</strong> revoked and
            deleted when you disconnect a social media account or close your account.
          </>,
          <>
            <strong className="text-slate-100">Analytics data:</strong> retained in
            aggregated form for up to 24 months for trend analysis.
          </>,
          <>
            <strong className="text-slate-100">Financial records:</strong> retained
            for 5 years as required by the South African Tax Administration Act.
          </>,
          <>
            <strong className="text-slate-100">Log data:</strong> retained for 12
            months for security and debugging purposes.
          </>,
        ]}
      />

      <Divider />

      {/* ─── 8. Your Rights Under POPIA ─── */}
      <SectionHeading id="your-rights">
        8. Your Rights Under POPIA
      </SectionHeading>
      <Paragraph>
        As a data subject under POPIA, you have the following rights regarding your
        personal information:
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Right of access (Section 23):</strong>{" "}
            you may request confirmation of whether we hold your personal information
            and request access to it.
          </>,
          <>
            <strong className="text-slate-100">
              Right to correction (Section 24):
            </strong>{" "}
            you may request that we correct or update inaccurate, incomplete, or
            misleading personal information.
          </>,
          <>
            <strong className="text-slate-100">
              Right to deletion (Section 24):
            </strong>{" "}
            you may request that we delete your personal information where it is no
            longer necessary for the purpose for which it was collected.
          </>,
          <>
            <strong className="text-slate-100">
              Right to object (Section 11(3)):
            </strong>{" "}
            you may object to the processing of your personal information on
            reasonable grounds.
          </>,
          <>
            <strong className="text-slate-100">
              Right to data portability:
            </strong>{" "}
            you may request your personal information in a structured, commonly used,
            machine-readable format.
          </>,
          <>
            <strong className="text-slate-100">
              Right to withdraw consent:
            </strong>{" "}
            where processing is based on consent, you may withdraw your consent at any
            time without affecting the lawfulness of processing prior to withdrawal.
          </>,
          <>
            <strong className="text-slate-100">
              Right to lodge a complaint:
            </strong>{" "}
            you may lodge a complaint with the Information Regulator (South Africa) if
            you believe your rights have been infringed.
          </>,
        ]}
      />
      <Paragraph>
        To exercise any of these rights, please contact our Information Officer using
        the details provided below. We will respond to your request within 30 days, as
        required by POPIA.
      </Paragraph>

      <Divider />

      {/* ─── 9. Information Officer Details ─── */}
      <SectionHeading id="information-officer">
        9. Information Officer Details
      </SectionHeading>
      <Paragraph>
        In accordance with Section 55 of POPIA, we have appointed an Information
        Officer responsible for ensuring compliance with the conditions for lawful
        processing of personal information:
      </Paragraph>
      <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/50 p-5">
        <p className="mb-1 font-medium text-white">
          The Information Officer
        </p>
        <p className="text-sm text-slate-300">
          Purple Glow Social (Pty) Ltd
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
          You may also lodge a complaint with the Information Regulator:
        </p>
        <p className="text-sm text-slate-300">
          The Information Regulator (South Africa)
        </p>
        <p className="text-sm text-slate-300">
          Email:{" "}
          <a
            href="mailto:inforeg@justice.gov.za"
            className="text-purple-400 hover:text-purple-300"
          >
            inforeg@justice.gov.za
          </a>
        </p>
      </div>

      <Divider />

      {/* ─── 10. Automated Decision-Making ─── */}
      <SectionHeading id="automated-decisions">
        10. Automated Decision-Making &amp; AI Content Generation
      </SectionHeading>
      <Paragraph>
        Purple Glow Social uses artificial intelligence (AI) to generate content
        suggestions, captions, hashtags, and post recommendations. This processing
        involves:
      </Paragraph>
      <BulletList
        items={[
          "Analysing your brand profile, tone preferences, and content history to generate relevant suggestions.",
          "Using AI models (including Google Gemini) to create draft content that aligns with your brand voice.",
          "Providing analytics-driven recommendations for optimal posting times and content strategies.",
        ]}
      />
      <Paragraph>
        <strong className="text-slate-100">Important:</strong> All AI-generated
        content is presented as suggestions only. You retain full control over what is
        published. No content is posted automatically without your explicit approval or
        scheduled action. You may review, edit, or reject any AI-generated suggestion
        before publication.
      </Paragraph>
      <Paragraph>
        In accordance with Section 71 of POPIA, you have the right not to be subject
        to a decision based solely on automated processing that significantly affects
        you. Our AI features are designed to assist, not replace, your editorial
        judgment.
      </Paragraph>

      <Divider />

      {/* ─── 11. Children's Privacy ─── */}
      <SectionHeading id="childrens-privacy">
        11. Children&apos;s Privacy
      </SectionHeading>
      <Paragraph>
        Purple Glow Social is not intended for use by children under the age of 18. We
        do not knowingly collect personal information from children. In accordance with
        Section 35 of POPIA, the processing of personal information of children
        requires the consent of a competent person (parent or guardian).
      </Paragraph>
      <Paragraph>
        If we become aware that we have collected personal information from a child
        without appropriate consent, we will take steps to delete that information
        promptly. If you believe a child has provided us with personal information,
        please contact our Information Officer immediately.
      </Paragraph>

      <Divider />

      {/* ─── 12. Changes to This Policy ─── */}
      <SectionHeading id="changes">
        12. Changes to This Policy
      </SectionHeading>
      <Paragraph>
        We may update this Privacy Policy from time to time to reflect changes in our
        practices, technology, legal requirements, or other factors. When we make
        material changes, we will:
      </Paragraph>
      <BulletList
        items={[
          "Update the \"Last updated\" date at the top of this page.",
          "Notify registered users via email or in-platform notification.",
          "Where required by POPIA, obtain fresh consent for any new processing activities.",
        ]}
      />
      <Paragraph>
        We encourage you to review this policy periodically to stay informed about how
        we protect your personal information.
      </Paragraph>

      <Divider />

      {/* ─── 13. Contact Details ─── */}
      <SectionHeading id="contact">13. Contact Details</SectionHeading>
      <Paragraph>
        If you have any questions, concerns, or requests regarding this Privacy Policy
        or how we handle your personal information, please contact us:
      </Paragraph>
      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-5">
        <p className="mb-1 font-medium text-white">
          Purple Glow Social (Pty) Ltd
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
