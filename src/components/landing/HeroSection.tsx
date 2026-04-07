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
            <span className="block mb-8 text-[10px] font-semibold tracking-[3px] uppercase text-[#71717A]">
              {t('label')}
            </span>

            <h1 className="font-display text-[clamp(40px,12vw,100px)] sm:text-[clamp(56px,7vw,100px)] font-normal leading-[0.9] tracking-[-0.04em] mb-8">
              <span className="block overflow-hidden">
                <span
                  className="inline-block [-webkit-text-stroke:1.5px_#F5F5F7] text-transparent animate-[landing-slide-up_1s_cubic-bezier(0.16,1,0.3,1)_0.2s_both]"
                >
                  {t('titleLine1')}
                </span>
              </span>
              <span className="block overflow-hidden">
                <span
                  className="inline-block bg-gradient-to-br from-[#F5F5F7] from-30% to-brand bg-clip-text text-transparent [-webkit-background-clip:text] animate-[landing-slide-up_1s_cubic-bezier(0.16,1,0.3,1)_0.35s_both]"
                >
                  {t('titleLine2')}
                </span>
              </span>
            </h1>

            <p className="text-base leading-[1.8] text-[#A1A1AA] font-light max-w-[440px] mb-10 opacity-0 animate-[landing-fade-in-up_0.8s_cubic-bezier(0.16,1,0.3,1)_0.6s_forwards]">
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
                className="inline-flex items-center justify-center w-11 h-11 border border-[#3F3F46] rounded-full transition-all duration-400 hover:border-brand hover:bg-brand-surface hover:scale-[1.08]"
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

          {/* Dashboard mockup visual */}
          <div className="order-first lg:order-last opacity-0 animate-[landing-fade-in-up_1.2s_cubic-bezier(0.16,1,0.3,1)_0.4s_forwards]">
            <div className="relative w-full max-w-[340px] lg:max-w-[460px] mx-auto">
              {/* Ambient glow behind the card */}
              <div className="absolute -inset-4 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(139,92,246,0.12)_0%,transparent_70%)] blur-2xl pointer-events-none" />

              <div className="relative rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-gradient-to-br from-[#111118] via-[#16121f] to-[#131318] shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
                {/* Window chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  <div className="ml-3 flex-1 h-5 rounded-md bg-[rgba(255,255,255,0.04)] flex items-center justify-center">
                    <span className="text-[9px] text-[#3F3F46] tracking-wide">app.purpleglow.social/dashboard</span>
                  </div>
                </div>

                {/* Dashboard content mockup */}
                <div className="p-5 space-y-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] p-3">
                      <span className="block text-[9px] text-[#71717A] uppercase tracking-wider">Posts</span>
                      <span className="block font-display text-xl text-[#F5F5F7] mt-0.5">247</span>
                      <span className="block text-[9px] text-green-500 mt-0.5">↑ 12%</span>
                    </div>
                    <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] p-3">
                      <span className="block text-[9px] text-[#71717A] uppercase tracking-wider">Reach</span>
                      <span className="block font-display text-xl text-[#F5F5F7] mt-0.5">18K</span>
                      <span className="block text-[9px] text-green-500 mt-0.5">↑ 28%</span>
                    </div>
                    <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] p-3">
                      <span className="block text-[9px] text-[#71717A] uppercase tracking-wider">Engage</span>
                      <span className="block font-display text-xl text-[#F5F5F7] mt-0.5">4.2%</span>
                      <span className="block text-[9px] text-green-500 mt-0.5">↑ 8%</span>
                    </div>
                  </div>

                  {/* Mini chart bars */}
                  <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] p-4">
                    <span className="block text-[9px] text-[#71717A] uppercase tracking-wider mb-3">Weekly Performance</span>
                    <div className="flex items-end gap-1.5 h-16">
                      {[40, 65, 45, 80, 60, 90, 70].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-brand/60 to-brand" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <span key={i} className="text-[8px] text-[#3F3F46] flex-1 text-center">{d}</span>
                      ))}
                    </div>
                  </div>

                  {/* Platform icons row */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex -space-x-1">
                      {['#E1306C', '#1DA1F2', '#0A66C2', '#FF0050'].map((color, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-[#111118]" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#71717A]">4 platforms connected</span>
                  </div>
                </div>

                {/* Bottom gradient fade */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[rgba(8,8,11,0.8)] to-transparent pointer-events-none" />
              </div>

              {/* Floating notification card */}
              <div className="absolute -bottom-3 -left-3 lg:-left-6 bg-[#1a1a24] border border-[rgba(255,255,255,0.08)] rounded-lg p-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-[3] animate-[landing-fade-in-up_1s_cubic-bezier(0.16,1,0.3,1)_1.2s_both]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-[10px] font-medium text-[#F5F5F7]">Post published</span>
                    <span className="block text-[8px] text-[#71717A]">Instagram • just now</span>
                  </div>
                </div>
              </div>

              {/* Badge overlay */}
              <div className="absolute top-10 right-5 text-right z-[3]">
                <span className="block text-[8px] font-semibold tracking-[2.5px] uppercase text-[#71717A] mb-1">
                  {t('badgeLabel')}
                </span>
                <span className="font-display italic text-[22px] text-[#F5F5F7]">
                  {t('badgePersona')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-11 border-t border-[rgba(255,255,255,0.06)] mt-10 gap-7 relative z-[1]">
          <p className="text-[11px] text-[#3F3F46] tracking-[0.3px] max-w-[280px] leading-relaxed">
            {t('statsDescription')}
          </p>
          <div className="flex gap-10 md:gap-16">
            <div className="text-left md:text-right">
              <span className="font-display text-4xl font-normal text-[#F5F5F7] leading-none">
                {t('statsLanguages')}
              </span>
              <span className="block text-[9px] text-[#3F3F46] uppercase tracking-[2px] mt-1.5">
                {t('statsLanguagesLabel')}
              </span>
            </div>
            <div className="text-left md:text-right">
              <span className="font-display text-4xl font-normal text-[#F5F5F7] leading-none">
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
