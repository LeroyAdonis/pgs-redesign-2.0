/**
 * Acceptable Use Policy page — /legal/acceptable-use
 *
 * Guidelines for responsible use of Purple Glow Social.
 * References the South African Constitution and hate speech laws.
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
    title: t("acceptableUse.title"),
    description: t("acceptableUse.description"),
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

export default async function AcceptableUsePolicyPage({ params }: Props) {
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
        {t("acceptableUse.title")}
      </h1>
      <p className="mb-8 text-sm text-slate-500">
        {t("lastUpdated")}: March 2026
      </p>

      {/* ─── 1. Purpose ─── */}
      <SectionHeading id="purpose">1. Purpose</SectionHeading>
      <Paragraph>
        This Acceptable Use Policy (&quot;AUP&quot;) sets out the rules and guidelines
        for using the Purple Glow Social platform and its associated services. This
        policy is designed to protect our users, our platform, and the broader online
        community.
      </Paragraph>
      <Paragraph>
        This policy applies to all users of Purple Glow Social, including free and paid
        subscribers, team members, and any person who accesses or uses our Service. By
        using Purple Glow Social, you agree to comply with this AUP. Failure to do so
        may result in suspension or termination of your account.
      </Paragraph>
      <Paragraph>
        This AUP should be read together with our{" "}
        <a
          href={`/${locale}/legal/terms`}
          className="text-purple-400 hover:text-purple-300"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href={`/${locale}/legal/privacy`}
          className="text-purple-400 hover:text-purple-300"
        >
          Privacy Policy
        </a>
        .
      </Paragraph>

      <Divider />

      {/* ─── 2. Acceptable Use ─── */}
      <SectionHeading id="acceptable-use">2. Acceptable Use</SectionHeading>
      <Paragraph>
        You may use Purple Glow Social for lawful purposes in accordance with these
        guidelines. Acceptable use includes:
      </Paragraph>
      <BulletList
        items={[
          "Managing your business or personal social media accounts in a legitimate and professional manner.",
          "Creating, scheduling, and publishing original content or content you have the right to use.",
          "Using AI-powered features to generate content suggestions for review and publication.",
          "Analysing social media performance and engagement through our analytics tools.",
          "Collaborating with team members on content creation and approval workflows.",
          "Integrating with supported social media platforms in accordance with their respective terms of service.",
        ]}
      />

      <Divider />

      {/* ─── 3. Prohibited Activities ─── */}
      <SectionHeading id="prohibited-activities">
        3. Prohibited Activities
      </SectionHeading>
      <Paragraph>
        The following activities are strictly prohibited when using Purple Glow Social.
        This list is not exhaustive, and we reserve the right to determine, in our sole
        discretion, what constitutes a violation of this policy.
      </Paragraph>

      <SubHeading>3.1 Spam and Unsolicited Content</SubHeading>
      <BulletList
        items={[
          "Sending or scheduling bulk unsolicited messages, comments, or promotional material.",
          "Using our platform to operate spam campaigns or distribute chain messages.",
          "Creating misleading or deceptive content designed to artificially inflate engagement.",
          "Using automated tools or scripts to generate excessive or repetitive posts.",
          "Purchasing or selling followers, likes, comments, or other forms of fake engagement.",
        ]}
      />

      <SubHeading>3.2 Harassment and Bullying</SubHeading>
      <BulletList
        items={[
          "Engaging in targeted harassment, bullying, or intimidation of any individual or group.",
          "Publishing content intended to threaten, stalk, or cause fear in another person.",
          "Encouraging others to engage in harassing behaviour.",
          "Doxxing — publishing private or identifying information about another person without their consent.",
        ]}
      />

      <SubHeading>3.3 Hate Speech and Discrimination</SubHeading>
      <Paragraph>
        In accordance with Section 16(2) of the Constitution of the Republic of South
        Africa, 1996, and the Promotion of Equality and Prevention of Unfair
        Discrimination Act, 2000 (Act No. 4 of 2000), the following is strictly
        prohibited:
      </Paragraph>
      <BulletList
        items={[
          "Content that advocates hatred based on race, ethnicity, gender, sex, pregnancy, marital status, ethnic or social origin, colour, sexual orientation, age, disability, religion, conscience, belief, culture, language, or birth.",
          "Content that incites imminent violence or harm against any person or group.",
          "Content that constitutes propaganda for war.",
          "Symbols, imagery, or language associated with hate groups or movements.",
          "Content that promotes unfair discrimination on any of the grounds listed in Section 9 of the Constitution.",
        ]}
      />

      <SubHeading>3.4 Impersonation</SubHeading>
      <BulletList
        items={[
          "Impersonating any person, business, organisation, or government entity.",
          "Creating accounts or content that falsely represents affiliation with any person or entity.",
          "Using another person's name, likeness, or brand without authorisation.",
        ]}
      />

      <SubHeading>3.5 Malware and Security Threats</SubHeading>
      <BulletList
        items={[
          "Uploading, transmitting, or distributing malware, viruses, trojans, worms, or any other malicious code.",
          "Attempting to gain unauthorised access to Purple Glow Social's systems, servers, or infrastructure.",
          "Conducting denial-of-service (DoS) attacks or any activity that disrupts the Service.",
          "Exploiting vulnerabilities in our platform without responsible disclosure.",
        ]}
      />

      <SubHeading>3.6 Scraping and Unauthorised Data Collection</SubHeading>
      <BulletList
        items={[
          "Scraping, crawling, or harvesting data from our platform or connected social media accounts without authorisation.",
          "Using bots, scripts, or automated tools to access the Service in violation of our terms.",
          "Extracting data for the purpose of building competing products or services.",
          "Collecting personal information of other users without their consent.",
        ]}
      />

      <SubHeading>3.7 Circumvention</SubHeading>
      <BulletList
        items={[
          "Attempting to bypass, disable, or circumvent any security features, access controls, rate limits, or usage restrictions.",
          "Using VPNs, proxies, or other tools to circumvent geographic restrictions or access controls.",
          "Sharing, selling, or transferring account credentials or subscription access to unauthorised parties.",
          "Reverse-engineering, decompiling, or disassembling any part of the Service.",
        ]}
      />

      <Divider />

      {/* ─── 4. AI Content Guidelines ─── */}
      <SectionHeading id="ai-content-guidelines">
        4. AI Content Guidelines
      </SectionHeading>
      <Paragraph>
        Purple Glow Social provides AI-powered content generation features. When using
        these features, you must:
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Review all AI-generated content</strong>{" "}
            before publishing. You are responsible for ensuring accuracy, appropriateness,
            and compliance with applicable laws.
          </>,
          <>
            <strong className="text-slate-100">
              Do not use AI features to generate
            </strong>{" "}
            hate speech, harassment, defamatory content, misinformation, or any content
            that violates this AUP.
          </>,
          <>
            <strong className="text-slate-100">
              Respect intellectual property:
            </strong>{" "}
            do not use AI features to generate content that infringes upon copyrights,
            trademarks, or other intellectual property rights of third parties.
          </>,
          <>
            <strong className="text-slate-100">Disclose AI usage</strong> where
            required by applicable platform policies or laws. Some social media
            platforms require disclosure when content is AI-generated.
          </>,
          <>
            <strong className="text-slate-100">
              Do not use AI features for deepfakes
            </strong>{" "}
            or to create realistic but fabricated content intended to deceive or
            mislead.
          </>,
        ]}
      />

      <Divider />

      {/* ─── 5. Content Moderation ─── */}
      <SectionHeading id="content-moderation">
        5. Content Moderation
      </SectionHeading>
      <Paragraph>
        Purple Glow Social reserves the right to review, moderate, and remove content
        that violates this AUP. Our content moderation practices include:
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Automated screening:</strong> we may
            use automated tools to detect and flag content that potentially violates
            this policy.
          </>,
          <>
            <strong className="text-slate-100">Human review:</strong> flagged content
            is reviewed by our team to determine whether a violation has occurred.
          </>,
          <>
            <strong className="text-slate-100">Prompt action:</strong> content found
            to be in violation will be removed or restricted promptly.
          </>,
          <>
            <strong className="text-slate-100">Transparency:</strong> we will notify
            you if content is removed or your account is restricted, along with the
            reason for the action.
          </>,
        ]}
      />
      <Paragraph>
        We strive to apply our policies fairly and consistently. However, we
        acknowledge that content moderation requires judgment, and we welcome
        feedback on our decisions through our appeals process.
      </Paragraph>

      <Divider />

      {/* ─── 6. Reporting Violations ─── */}
      <SectionHeading id="reporting">
        6. Reporting Violations
      </SectionHeading>
      <Paragraph>
        If you encounter content or behaviour on our platform that you believe violates
        this AUP, we encourage you to report it:
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Email:</strong>{" "}
            <a
              href="mailto:abuse@purpleglowsocial.co.za"
              className="text-purple-400 hover:text-purple-300"
            >
              abuse@purpleglowsocial.co.za
            </a>
          </>,
          <>
            <strong className="text-slate-100">In-platform:</strong> use the
            &quot;Report&quot; feature available on content and user profiles.
          </>,
        ]}
      />
      <Paragraph>
        When reporting a violation, please provide as much detail as possible,
        including:
      </Paragraph>
      <BulletList
        items={[
          "A description of the violation",
          "The URL or location of the offending content",
          "Screenshots or other evidence, if available",
          "Your contact information for follow-up",
        ]}
      />
      <Paragraph>
        We will review all reports promptly and take appropriate action. Reports are
        treated confidentially, and we will not disclose your identity to the reported
        party without your consent, unless required by law.
      </Paragraph>

      <Divider />

      {/* ─── 7. Consequences of Violation ─── */}
      <SectionHeading id="consequences">
        7. Consequences of Violation
      </SectionHeading>
      <Paragraph>
        Violations of this AUP may result in one or more of the following actions, at
        our sole discretion:
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Warning:</strong> a written warning
            notifying you of the violation and requesting immediate corrective action.
          </>,
          <>
            <strong className="text-slate-100">Content removal:</strong> removal of
            offending content from the platform, including scheduled or published
            posts.
          </>,
          <>
            <strong className="text-slate-100">Feature restriction:</strong>{" "}
            temporary or permanent restriction of access to certain features, such as
            AI content generation or scheduling.
          </>,
          <>
            <strong className="text-slate-100">Account suspension:</strong> temporary
            suspension of your account pending investigation.
          </>,
          <>
            <strong className="text-slate-100">Account termination:</strong>{" "}
            permanent termination of your account without refund.
          </>,
          <>
            <strong className="text-slate-100">Legal action:</strong> where
            appropriate, reporting the violation to law enforcement authorities or
            pursuing legal remedies.
          </>,
        ]}
      />
      <Paragraph>
        The severity of the consequence will depend on the nature and severity of the
        violation, whether it is a first offence or a repeat violation, and whether the
        violation causes harm to other users or third parties.
      </Paragraph>
      <Paragraph>
        If your account is suspended or terminated, you may appeal the decision by
        contacting{" "}
        <a
          href="mailto:appeals@purpleglowsocial.co.za"
          className="text-purple-400 hover:text-purple-300"
        >
          appeals@purpleglowsocial.co.za
        </a>{" "}
        within 14 days of the notification. Appeals will be reviewed by a senior member
        of our team who was not involved in the original decision.
      </Paragraph>

      <Divider />

      {/* ─── 8. Modifications ─── */}
      <SectionHeading id="modifications">8. Modifications</SectionHeading>
      <Paragraph>
        We may update this Acceptable Use Policy from time to time to reflect changes
        in our practices, legal requirements, or platform features. When we make
        material changes:
      </Paragraph>
      <BulletList
        items={[
          "We will update the \"Last updated\" date at the top of this page.",
          "We will notify registered users via email or in-platform notification.",
          "Material changes will take effect 30 days after notification, unless a shorter period is required to address an urgent safety or legal issue.",
          "Your continued use of the Service after the effective date constitutes acceptance of the updated policy.",
        ]}
      />

      <Divider />

      {/* ─── 9. Contact ─── */}
      <SectionHeading id="contact">9. Contact</SectionHeading>
      <Paragraph>
        If you have any questions about this Acceptable Use Policy, or if you wish to
        report a violation, please contact us:
      </Paragraph>
      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-5">
        <p className="mb-1 font-medium text-white">
          Purple Glow Social (Pty) Ltd
        </p>
        <p className="text-sm text-slate-300">
          General enquiries:{" "}
          <a
            href="mailto:legal@purpleglowsocial.co.za"
            className="text-purple-400 hover:text-purple-300"
          >
            legal@purpleglowsocial.co.za
          </a>
        </p>
        <p className="text-sm text-slate-300">
          Report abuse:{" "}
          <a
            href="mailto:abuse@purpleglowsocial.co.za"
            className="text-purple-400 hover:text-purple-300"
          >
            abuse@purpleglowsocial.co.za
          </a>
        </p>
        <p className="text-sm text-slate-300">
          Appeals:{" "}
          <a
            href="mailto:appeals@purpleglowsocial.co.za"
            className="text-purple-400 hover:text-purple-300"
          >
            appeals@purpleglowsocial.co.za
          </a>
        </p>
        <p className="mt-3 text-sm text-slate-400">
          This policy is governed by the laws of the Republic of South Africa,
          including the Constitution of the Republic of South Africa, 1996.
        </p>
      </div>
    </article>
  );
}
