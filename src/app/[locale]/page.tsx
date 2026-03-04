/**
 * Home page — Purple Glow Social 2.0
 *
 * Production landing page composed of modular section components.
 * Uses next-intl for all user-facing strings via the landing namespace.
 * Dark-themed by default via data-theme attribute.
 */

import { setRequestLocale } from "next-intl/server";
import {
  LandingNavbar,
  HeroSection,
  MarqueeSection,
  FeaturesSection,
  ProcessSection,
  TestimonialsSection,
  PricingSection,
  CreditsSection,
  ContactSection,
  LandingFooter,
} from "@/components/landing";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div data-theme="dark" className="bg-[#08080B] text-[#F5F5F7] min-h-dvh overflow-x-hidden">
      {/* Ambient gradient blobs */}
      <div className="fixed rounded-full pointer-events-none z-0 w-[800px] h-[800px] top-[-300px] right-[-200px] bg-[radial-gradient(circle,rgba(139,92,246,0.08)_0%,transparent_70%)] blur-[120px] opacity-0 animate-[landing-ambient-fade_2s_cubic-bezier(0.16,1,0.3,1)_0.5s_forwards]" />
      <div className="fixed rounded-full pointer-events-none z-0 w-[600px] h-[600px] top-1/2 left-[-200px] bg-[radial-gradient(circle,rgba(139,92,246,0.05)_0%,transparent_70%)] blur-[120px] opacity-0 animate-[landing-ambient-fade_2s_cubic-bezier(0.16,1,0.3,1)_1s_forwards]" />
      <div className="fixed rounded-full pointer-events-none z-0 w-[700px] h-[700px] bottom-[-200px] right-[-150px] bg-[radial-gradient(circle,rgba(139,92,246,0.06)_0%,transparent_70%)] blur-[120px] opacity-0 animate-[landing-ambient-fade_2s_cubic-bezier(0.16,1,0.3,1)_1.5s_forwards]" />

      <LandingNavbar />

      <main id="main-content">
        <HeroSection />
        <MarqueeSection />
        <FeaturesSection />
        <ProcessSection />
        <TestimonialsSection />
        <PricingSection />
        <CreditsSection />
        <ContactSection />
      </main>

      <LandingFooter />
    </div>
  );
}
