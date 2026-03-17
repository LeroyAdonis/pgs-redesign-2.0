/**
 * Sign-up page — Purple Glow Social 2.0
 *
 * Server component that renders the sign-up form.
 * The actual interactive form is a client component (SignupForm).
 */

import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { SignupForm } from "./signup-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SignupPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SignupContent />;
}

/**
 * Sync wrapper so useTranslations hook works properly.
 * Passes translated strings to the client form component.
 */
function SignupContent() {
  const t = useTranslations("auth");

  return (
    <div>
      <h1 className="text-center font-display text-2xl font-bold text-text">
        {t("signUpTitle")}
      </h1>
      <p className="mt-2 text-center text-sm text-text-muted">
        {t("hasAccount")}{" "}
        <a
          href="login"
          className="font-medium text-brand hover:text-brand/80"
        >
          {t("signIn")}
        </a>
      </p>
      <SignupForm
        labels={{
          email: t("email"),
          password: t("password"),
          signUp: t("signUp"),
          continueWithGoogle: t("continueWithGoogle"),
          continueWithGithub: t("continueWithGithub"),
          or: "or",
        }}
      />
    </div>
  );
}
