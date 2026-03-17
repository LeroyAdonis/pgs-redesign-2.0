/**
 * Login page — Purple Glow Social 2.0
 *
 * Server component that renders the login form.
 * The actual interactive form is a client component (LoginForm).
 */

import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { LoginForm } from "./login-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LoginContent />;
}

/**
 * Sync wrapper so useTranslations hook works properly.
 * Passes translated strings to the client form component.
 */
function LoginContent() {
  const t = useTranslations("auth");

  return (
    <div>
      <h1 className="text-center font-display text-2xl font-bold text-text">
        {t("signInTitle")}
      </h1>
      <p className="mt-2 text-center text-sm text-text-muted">
        {t("noAccount")}{" "}
        <a
          href="signup"
          className="font-medium text-brand hover:text-brand/80"
        >
          {t("signUp")}
        </a>
      </p>
      <LoginForm
        labels={{
          email: t("email"),
          password: t("password"),
          signIn: t("signIn"),
          signingIn: t("signingIn"),
          forgotPassword: t("forgotPassword"),
          continueWithGoogle: t("continueWithGoogle"),
          continueWithGithub: t("continueWithGithub"),
          or: "or",
          oauthAccountError: t("oauthAccountError"),
        }}
      />
    </div>
  );
}
