/**
 * Forgot Password page — Purple Glow Social 2.0
 *
 * Server component that renders the forgot-password form.
 * The actual interactive form is a client component (ForgotPasswordForm).
 */

import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { ForgotPasswordForm } from "./forgot-password-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ForgotPasswordContent />;
}

/**
 * Sync wrapper so useTranslations hook works properly.
 * Passes translated strings to the client form component.
 */
function ForgotPasswordContent() {
  const t = useTranslations("auth");

  return (
    <div>
      <h1 className="text-center font-display text-2xl font-bold text-text">
        {t("forgotPasswordTitle")}
      </h1>
      <p className="mt-2 text-center text-sm text-text-muted">
        {t("forgotPasswordDescription")}
      </p>
      <ForgotPasswordForm
        labels={{
          email: t("email"),
          sendResetLink: t("sendResetLink"),
          resetLinkSent: t("resetLinkSent"),
          resetLinkSentDescription: t("resetLinkSentDescription"),
          backToLogin: t("backToLogin"),
        }}
      />
    </div>
  );
}
