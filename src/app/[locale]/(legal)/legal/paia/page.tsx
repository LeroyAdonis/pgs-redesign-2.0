/**
 * PAIA Manual page — /legal/paia
 *
 * Full PAIA (Promotion of Access to Information Act, No. 2 of 2000) manual
 * as required by South African law for all private and public bodies.
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
    title: t("paia.title"),
    description: t("paia.description"),
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

export default async function PaiaManualPage({ params }: Props) {
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
        {t("paia.title")}
      </h1>
      <p className="mb-2 text-sm text-slate-500">
        {t("lastUpdated")}: March 2026
      </p>
      <p className="mb-8 text-sm font-medium text-slate-400">
        Manual prepared in accordance with Section 51 of the Promotion of Access
        to Information Act, No. 2 of 2000 (&quot;PAIA&quot;), as amended by the
        Protection of Personal Information Act, No. 4 of 2013 (&quot;POPIA&quot;)
      </p>

      {/* ─── 1. Introduction & Purpose ─── */}
      <SectionHeading id="introduction">
        1. Introduction &amp; Purpose
      </SectionHeading>
      <Paragraph>
        This manual is published in compliance with Section 51 of the Promotion of
        Access to Information Act, No. 2 of 2000 (&quot;PAIA&quot;), as amended. PAIA
        gives effect to the constitutional right of access to any information held by a
        private body that is required for the exercise or protection of any rights, as
        enshrined in Section 32 of the Constitution of the Republic of South Africa,
        1996.
      </Paragraph>
      <Paragraph>
        The purpose of this manual is to:
      </Paragraph>
      <BulletList
        items={[
          "Provide information about Purple Glow Social (Pty) Ltd and its functions.",
          "Describe the categories of records held by Purple Glow Social (Pty) Ltd.",
          "Outline the procedure for requesting access to records.",
          "Set out the prescribed fees payable for access to records.",
          "Inform data subjects about the processing of their personal information in accordance with POPIA.",
        ]}
      />

      <Divider />

      {/* ─── 2. Contact Details of Information Officer ─── */}
      <SectionHeading id="information-officer">
        2. Contact Details of Information Officer
      </SectionHeading>
      <Paragraph>
        The following person has been designated as the Information Officer of Purple
        Glow Social (Pty) Ltd in terms of Section 55 of POPIA:
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
      </div>

      <Divider />

      {/* ─── 3. Section 10 Guide ─── */}
      <SectionHeading id="section-10-guide">
        3. Section 10 Guide — South African Human Rights Commission
      </SectionHeading>
      <Paragraph>
        The South African Human Rights Commission (&quot;SAHRC&quot;) has compiled a
        guide in terms of Section 10 of PAIA, which contains information to assist a
        person who wishes to exercise any right contemplated in PAIA. This guide is
        available from:
      </Paragraph>
      <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/50 p-5">
        <p className="mb-1 font-medium text-white">
          South African Human Rights Commission
        </p>
        <p className="text-sm text-slate-300">
          PAIA Unit: The Research and Documentation Department
        </p>
        <p className="text-sm text-slate-300">
          Telephone: +27 (0) 11 877 3600
        </p>
        <p className="text-sm text-slate-300">
          Website:{" "}
          <a
            href="https://www.sahrc.org.za"
            className="text-purple-400 hover:text-purple-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.sahrc.org.za
          </a>
        </p>
        <p className="text-sm text-slate-300">
          Email:{" "}
          <a
            href="mailto:paia@sahrc.org.za"
            className="text-purple-400 hover:text-purple-300"
          >
            paia@sahrc.org.za
          </a>
        </p>
      </div>

      <Divider />

      {/* ─── 4. Records Available Without Request ─── */}
      <SectionHeading id="records-without-request">
        4. Records Available Without Request
      </SectionHeading>
      <Paragraph>
        In terms of Section 52(2) of PAIA, the following categories of records are
        freely available on our website without the need to submit a formal PAIA
        request:
      </Paragraph>
      <BulletList
        items={[
          <>
            <a
              href={`/${locale}/legal/privacy`}
              className="text-purple-400 hover:text-purple-300"
            >
              Privacy Policy
            </a>
          </>,
          <>
            <a
              href={`/${locale}/legal/terms`}
              className="text-purple-400 hover:text-purple-300"
            >
              Terms of Service
            </a>
          </>,
          <>
            <a
              href={`/${locale}/legal/cookies`}
              className="text-purple-400 hover:text-purple-300"
            >
              Cookie Policy
            </a>
          </>,
          <>
            <a
              href={`/${locale}/legal/acceptable-use`}
              className="text-purple-400 hover:text-purple-300"
            >
              Acceptable Use Policy
            </a>
          </>,
          "This PAIA Manual",
          "Subscription and pricing information",
          "General company information available on our website",
        ]}
      />

      <Divider />

      {/* ─── 5. Records Available on Request ─── */}
      <SectionHeading id="records-on-request">
        5. Records Available on Request
      </SectionHeading>
      <Paragraph>
        The following records may be made available on request, subject to the grounds
        of refusal set out in Chapter 4 of Part 3 of PAIA:
      </Paragraph>

      <SubHeading>5.1 Company Records</SubHeading>
      <BulletList
        items={[
          "Registration documents and memorandum of incorporation",
          "Financial statements and annual returns",
          "Minutes of board meetings (non-confidential portions)",
          "Internal policies and procedures (non-confidential)",
          "Organisational structure and employee records (limited)",
        ]}
      />

      <SubHeading>5.2 Client Records</SubHeading>
      <BulletList
        items={[
          "Personal information held about the requester (data subject access requests)",
          "Subscription and account details",
          "Billing and payment records",
          "Correspondence and communications",
          "Service usage records and logs",
        ]}
      />

      <SubHeading>5.3 Operational Records</SubHeading>
      <BulletList
        items={[
          "Information security and data protection policies",
          "Technology and infrastructure documentation (non-confidential)",
          "Compliance reports and audit findings (non-confidential)",
          "Third-party contracts and agreements (limited, subject to confidentiality)",
          "AI model usage and data processing documentation",
        ]}
      />

      <Divider />

      {/* ─── 6. Request Procedure ─── */}
      <SectionHeading id="request-procedure">
        6. Request Procedure
      </SectionHeading>
      <Paragraph>
        To request access to records held by Purple Glow Social (Pty) Ltd, please
        follow these steps:
      </Paragraph>

      <SubHeading>6.1 Completing the Prescribed Form</SubHeading>
      <Paragraph>
        A request for access to a record must be made on the prescribed form (Form C),
        as set out in Annexure B of the Rules Relating to PAIA (Government Notice R187,
        published in Government Gazette No. 23119 of 15 February 2002, as amended).
      </Paragraph>
      <Paragraph>
        The form requires the following information:
      </Paragraph>
      <BulletList
        items={[
          "Your full name and surname",
          "Postal and/or email address",
          "Telephone number",
          "A clear description of the record(s) you are requesting",
          "The form in which you would like access (e.g. inspection, copy, electronic format)",
          "Your reason for requesting the record(s)",
          "If the request is made on behalf of another person, proof of authorisation",
        ]}
      />

      <SubHeading>6.2 Submitting Your Request</SubHeading>
      <Paragraph>
        Completed forms should be submitted to our Information Officer:
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Email:</strong>{" "}
            <a
              href="mailto:privacy@purpleglowsocial.co.za"
              className="text-purple-400 hover:text-purple-300"
            >
              privacy@purpleglowsocial.co.za
            </a>
          </>,
          <>
            <strong className="text-slate-100">Subject line:</strong>{" "}
            &quot;PAIA Request — [Your Name]&quot;
          </>,
        ]}
      />

      <SubHeading>6.3 Proof of Identity</SubHeading>
      <Paragraph>
        You will be required to provide adequate proof of identity (e.g. a certified
        copy of your South African identity document or passport) before your request
        is processed.
      </Paragraph>

      <Divider />

      {/* ─── 7. Prescribed Fees ─── */}
      <SectionHeading id="prescribed-fees">
        7. Prescribed Fees
      </SectionHeading>
      <Paragraph>
        Two types of fees are payable under PAIA:
      </Paragraph>

      <SubHeading>7.1 Request Fee</SubHeading>
      <Paragraph>
        A non-refundable request fee of R50.00 is payable by all requesters, other than
        personal requesters (individuals requesting access to their own personal
        information). The request fee must be paid before the request is processed.
      </Paragraph>

      <SubHeading>7.2 Access Fee</SubHeading>
      <Paragraph>
        An access fee is payable if the request for access is granted. The access fee is
        calculated based on the prescribed tariff in the PAIA regulations and covers
        costs such as:
      </Paragraph>
      <BulletList
        items={[
          "Photocopying or printing of records",
          "Search and preparation time (per hour or part thereof)",
          "Postage or electronic transmission costs",
          "Transcription fees where applicable",
        ]}
      />
      <Paragraph>
        A personal requester (requesting their own personal information) is not
        required to pay a request fee, but may still be required to pay an access fee
        for the reproduction of records.
      </Paragraph>
      <Paragraph>
        Current fee schedules are as prescribed in the PAIA regulations (Government
        Gazette No. 23119, as amended). We will notify you of the applicable fees
        before processing your request.
      </Paragraph>

      <Divider />

      {/* ─── 8. Decision ─── */}
      <SectionHeading id="decision">8. Decision</SectionHeading>
      <Paragraph>
        The Information Officer will make a decision on your request within 30 days
        from the date of receipt. This period may be extended by a further 30 days if:
      </Paragraph>
      <BulletList
        items={[
          "The request is for a large number of records or requires a search through a large volume of records.",
          "The request requires consultation with another body or a third party.",
          "The requester consents to the extension.",
        ]}
      />
      <Paragraph>
        You will be notified in writing of the decision, including the reasons for any
        refusal and your right to lodge an appeal or application with a court.
      </Paragraph>

      <Divider />

      {/* ─── 9. Remedies ─── */}
      <SectionHeading id="remedies">9. Remedies</SectionHeading>
      <Paragraph>
        If your request is refused, or if you are dissatisfied with the decision of the
        Information Officer, you have the following remedies:
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">Internal appeal:</strong> you may lodge
            an internal appeal within 60 days of notification of the decision, in
            accordance with Section 74 of PAIA (applicable to public bodies; for
            private bodies, the application to court process applies).
          </>,
          <>
            <strong className="text-slate-100">Application to court:</strong> you may
            apply to the High Court of South Africa for relief in accordance with
            Section 78 of PAIA within 180 days of notification of the decision, or
            after the decision period has expired without a decision being made.
          </>,
          <>
            <strong className="text-slate-100">
              Complaint to the Information Regulator:
            </strong>{" "}
            you may lodge a complaint with the Information Regulator (South Africa) at{" "}
            <a
              href="mailto:inforeg@justice.gov.za"
              className="text-purple-400 hover:text-purple-300"
            >
              inforeg@justice.gov.za
            </a>
            .
          </>,
        ]}
      />

      <Divider />

      {/* ─── 10. Third Party Records ─── */}
      <SectionHeading id="third-party-records">
        10. Third Party Records
      </SectionHeading>
      <Paragraph>
        Where a request for access to a record involves information relating to a third
        party, we are required in terms of Sections 71 and 72 of PAIA to notify that
        third party and give them an opportunity to make representations regarding the
        release of the information.
      </Paragraph>
      <Paragraph>
        The Information Officer must take into account the following grounds for refusal
        in relation to third-party records:
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong className="text-slate-100">
              Section 63 — Personal information:
            </strong>{" "}
            unreasonable disclosure of the personal information of a third party.
          </>,
          <>
            <strong className="text-slate-100">
              Section 64 — Commercial information:
            </strong>{" "}
            trade secrets, financial, commercial, scientific, or technical information
            that would cause harm if disclosed.
          </>,
          <>
            <strong className="text-slate-100">
              Section 65 — Confidential information:
            </strong>{" "}
            information provided in confidence where disclosure would breach an
            obligation of confidence.
          </>,
          <>
            <strong className="text-slate-100">
              Section 66 — Safety of individuals:
            </strong>{" "}
            disclosure that could endanger the life or physical safety of an
            individual.
          </>,
        ]}
      />

      <Divider />

      {/* ─── 11. Categories of Records ─── */}
      <SectionHeading id="categories-of-records">
        11. Categories of Records
      </SectionHeading>
      <Paragraph>
        Purple Glow Social (Pty) Ltd holds records in the following categories:
      </Paragraph>

      <SubHeading>11.1 Company Records</SubHeading>
      <BulletList
        items={[
          "Memorandum of Incorporation and company registration documents",
          "Annual financial statements and tax records",
          "Intellectual property records (trademarks, copyrights, patents)",
          "Insurance policies",
          "Board and shareholder resolutions",
          "Corporate governance documents",
        ]}
      />

      <SubHeading>11.2 Client and Customer Records</SubHeading>
      <BulletList
        items={[
          "User account registration information",
          "Subscription and billing records",
          "Social media account connection records (OAuth tokens are encrypted and not directly accessible)",
          "Content and post data",
          "Analytics and usage data",
          "Support tickets and correspondence",
          "Consent records (including cookie consent and data processing consent)",
        ]}
      />

      <SubHeading>11.3 Employee and Human Resources Records</SubHeading>
      <BulletList
        items={[
          "Employment contracts and agreements",
          "Payroll and tax records (IRP5, UIF)",
          "Performance reviews and disciplinary records",
          "Leave records",
          "Skills development and training records",
          "BEE (Broad-Based Black Economic Empowerment) compliance records",
        ]}
      />

      <SubHeading>11.4 Operational and Technical Records</SubHeading>
      <BulletList
        items={[
          "System architecture and infrastructure documentation",
          "Information security policies and incident reports",
          "Data processing agreements with third-party providers",
          "AI model documentation and data processing records",
          "Server and application logs",
          "Backup and disaster recovery plans",
        ]}
      />

      <SubHeading>11.5 Statutory and Regulatory Records</SubHeading>
      <BulletList
        items={[
          "POPIA compliance documentation",
          "PAIA manual and access request records",
          "Tax compliance records (SARS)",
          "Consumer Protection Act compliance records",
          "Electronic Communications and Transactions Act compliance records",
        ]}
      />

      <Divider />

      {/* ─── 12. Availability of This Manual ─── */}
      <SectionHeading id="availability">
        12. Availability of This Manual
      </SectionHeading>
      <Paragraph>
        This PAIA Manual is available:
      </Paragraph>
      <BulletList
        items={[
          "On our website at this page.",
          "On request from our Information Officer via email.",
          "For inspection at our registered office during business hours (by appointment).",
          "At the offices of the South African Human Rights Commission, if applicable.",
        ]}
      />
      <Paragraph>
        This manual will be updated from time to time to reflect changes in our
        operations, legal requirements, or contact details. The most current version
        will always be available on our website.
      </Paragraph>

      <div className="mt-8 rounded-lg border border-slate-700 bg-slate-900/50 p-5">
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
          Prepared in accordance with the Promotion of Access to Information Act,
          No. 2 of 2000, and the Protection of Personal Information Act, No. 4 of
          2013.
        </p>
      </div>
    </article>
  );
}
