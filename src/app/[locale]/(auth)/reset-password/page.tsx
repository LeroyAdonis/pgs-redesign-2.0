/**
 * Reset Password page — Purple Glow Social 2.0
 *
 * Server component that renders the reset-password form.
 * The actual interactive form is a client component (ResetPasswordForm).
 *
 * Expects a `?token=...` search param from the reset email link.
 */

import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { ResetPasswordForm } from "./reset-password-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ResetPasswordContent />;
}

/**
 * Sync wrapper so useTranslations hook works properly.
 * Passes translated strings to the client form component.
 */
function ResetPasswordContent() {
  const t = useTranslations("auth");

  return (
    <div>
      <h1 className="text-center font-display text-2xl font-bold text-text">
        {t("resetPasswordTitle")}
      </h1>
      <p className="mt-2 text-center text-sm text-text-muted">
        {t("resetPasswordDescription")}
      </p>
      <ResetPasswordForm
        labels={{
          newPassword: t("newPassword"),
          confirmPassword: t("confirmPassword"),
          resetPassword: t("resetPassword"),
          resetting: t("resetting"),
          passwordResetSuccess: t("passwordResetSuccess"),
          backToLogin: t("backToLogin"),
          passwordsMustMatch: t("passwordsMustMatch"),
          invalidResetToken: t("invalidResetToken"),
        }}
      />
    </div>
  );
}
