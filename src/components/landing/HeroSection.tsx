import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * Hero section — "LIQUID INTELLIGENCE" split-text hero with visual placeholder.
 *
 * Server component. All animations are CSS-driven.
 * Matches the hero design from index-v2.html.
 */
export function HeroSection() {
  const t = useTranslations('landing.hero');

  return (
    <section className="relative flex flex-col justify-center min-h-dvh pt-[120px] pb-[60px] lg:pt-[160px] lg:pb-20">
      {/* Radial glow behind hero */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-full h-full max-w-[1200px] bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(139,92,246,0.06)_0%,transparent_70%)]" />

      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center relative z-[1]">
          {/* Content */}
          <div>
            <span className="block mb-8 text-[10px] font-semibold tracking-[3px] uppercase text-text-muted">
              {t('label')}
            </span>

            <h1 className="font-display text-[clamp(40px,12vw,100px)] sm:text-[clamp(56px,7vw,100px)] font-normal leading-[0.9] tracking-[-0.04em] mb-8">
              <span className="block overflow-hidden">
                <span
                  className="inline-block [-webkit-text-stroke:1.5px_text] text-transparent animate-[landing-slide-up_1s_cubic-bezier(0.16,1,0.3,1)_0.2s_both]"
                >
                  {t('titleLine1')}
                </span>
              </span>
              <span className="block overflow-hidden">
                <span
                  className="inline-block bg-gradient-to-br from-text from-30% to-brand bg-clip-text text-transparent [-webkit-background-clip:text] animate-[landing-slide-up_1s_cubic-bezier(0.16,1,0.3,1)_0.35s_both]"
                >
                  {t('titleLine2')}
                </span>
              </span>
            </h1>

            <p className="text-base leading-[1.8] text-text-secondary font-light max-w-[440px] mb-10 opacity-0 animate-[landing-fade-in-up_0.8s_cubic-bezier(0.16,1,0.3,1)_0.6s_forwards]">
              {t('description')}
            </p>

            <div className="flex items-center gap-5 mb-5 opacity-0 animate-[landing-fade-in-up_0.8s_cubic-bezier(0.16,1,0.3,1)_0.8s_forwards]">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-xs font-semibold tracking-[1.5px] uppercase bg-brand text-white rounded-[3px] hover:bg-brand-hover hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(139,92,246,0.35)] transition-all duration-400 relative overflow-hidden"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {t('startCreating')}
              </Link>
              <button
                className="inline-flex items-center justify-center w-11 h-11 border border-border-strong rounded-full transition-all duration-400 hover:border-brand hover:bg-brand-surface hover:scale-[1.08]"
                aria-label={t('watchDemo')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
              </button>
            </div>

            <p className="text-[11px] text-[#3F3F46] tracking-[0.5px] opacity-0 animate-[landing-fade-in-up_0.8s_cubic-bezier(0.16,1,0.3,1)_1s_forwards]">
              {t('poweredBy')}{' '}
              <a href="#" className="text-brand underline underline-offset-[3px] decoration-[rgba(139,92,246,0.4)]">
                {t('poweredByLink')}
              </a>
            </p>
          </div>

          {/* Visual placeholder */}
          <div className="order-first lg:order-last opacity-0 animate-[landing-fade-in-up_1.2s_cubic-bezier(0.16,1,0.3,1)_0.4s_forwards]">
            <div className="relative w-full max-w-[340px] lg:max-w-[460px] mx-auto rounded-md overflow-hidden">
              <div className="absolute inset-0 border border-border rounded-md z-[2] pointer-events-none" />
              <div className="w-full aspect-[3/4] bg-gradient-to-br from-[#111118] via-[#1a1528] to-[#151520] flex items-center justify-center relative">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="0.4" aria-hidden="true">
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[rgba(0,0,0,0.4)] to-transparent" />
              </div>
              <div className="absolute top-6 right-6 text-right z-[3]">
                <span className="block text-[8px] font-semibold tracking-[2.5px] uppercase text-text-muted mb-1">
                  {t('badgeLabel')}
                </span>
                <span className="font-display italic text-[22px] text-text-inverse">
                  {t('badgePersona')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-11 border-t border-border mt-10 gap-7 relative z-[1]">
          <p className="text-[11px] text-[#3F3F46] tracking-[0.3px] max-w-[280px] leading-relaxed">
            {t('statsDescription')}
          </p>
          <div className="flex gap-10 md:gap-16">
            <div className="text-left md:text-right">
              <span className="font-display text-4xl font-normal text-text-inverse leading-none">
                {t('statsLanguages')}
              </span>
              <span className="block text-[9px] text-[#3F3F46] uppercase tracking-[2px] mt-1.5">
                {t('statsLanguagesLabel')}
              </span>
            </div>
            <div className="text-left md:text-right">
              <span className="font-display text-4xl font-normal text-text-inverse leading-none">
                {t('statsOnline')}
              </span>
              <span className="block text-[9px] text-[#3F3F46] uppercase tracking-[2px] mt-1.5">
                {t('statsOnlineLabel')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
