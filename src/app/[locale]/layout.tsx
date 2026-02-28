/**
 * Locale-aware layout for all pages under /[locale]/
 *
 * This layout:
 * - Validates the locale param and returns 404 for invalid locales
 * - Renders <html lang={locale}> and <body> with font classes
 * - Provides NextIntlClientProvider with messages for client components
 * - Enables static rendering via setRequestLocale
 *
 * All page content renders inside this layout.
 */

import type { Metadata, Viewport } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";

/**
 * Sora — Primary body font
 * Variable font loaded from Google Fonts with Latin subset.
 */
const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

/**
 * JetBrains Mono — Monospace font for code blocks
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

/**
 * Note: Instrument Serif is not available on Google Fonts.
 * It will be self-hosted in a later task (Phase 1.5 — Design System).
 * For now, the CSS variable --font-display falls back to system serif.
 */

export const metadata: Metadata = {
  title: {
    default: "Purple Glow Social",
    template: "%s | Purple Glow Social",
  },
  description:
    "AI-powered social media management platform for South African businesses. Schedule posts, analyze performance, and grow your brand across all major platforms.",
  keywords: [
    "social media management",
    "South Africa",
    "AI content",
    "scheduling",
    "analytics",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0a1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Generate static params for all supported locales.
 * This enables static rendering at build time for each locale.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  // In Next.js 16, params is async — must be awaited
  const { locale } = await params;

  // Validate locale against our routing config
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering for this locale
  setRequestLocale(locale);

  // Load all messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${sora.variable} ${jetbrainsMono.variable} font-body antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
