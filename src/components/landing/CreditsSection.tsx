import { useTranslations } from 'next-intl';

/**
 * Credits section — "Need more ammunition?" with credit pack options.
 *
 * Server component. Matches the credits section from index-v2.html.
 */
export function CreditsSection() {
  const t = useTranslations('landing.credits');

  return (
    <section className="py-20">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8">
        <div className="bg-[#131318] border border-[rgba(255,255,255,0.06)] rounded-lg p-8 sm:p-14 flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(139,92,246,0.04),transparent_70%)] pointer-events-none" />

          {/* Content */}
          <div className="flex-1 relative z-[1] text-center lg:text-left">
            <span className="block mb-4 text-[10px] font-semibold tracking-[3px] uppercase text-brand">
              {t('label')}
            </span>
            <h3 className="font-display text-[30px] font-normal italic mb-3">
              {t('title')}
            </h3>
            <p className="text-sm text-[#A1A1AA] leading-[1.7] font-light mb-6">
              {t('description')}
            </p>
            <div className="flex gap-6 justify-center lg:justify-start">
              <a
                href="#"
                className="text-xs font-semibold text-brand underline underline-offset-[3px] decoration-[rgba(139,92,246,0.4)] hover:decoration-brand transition-colors duration-300"
              >
                {t('buyStill')}
              </a>
              <a
                href="#"
                className="text-xs font-semibold text-brand underline underline-offset-[3px] decoration-[rgba(139,92,246,0.4)] hover:decoration-brand transition-colors duration-300"
              >
                {t('buyVideo')}
              </a>
            </div>
          </div>

          {/* Checkout */}
          <div className="relative z-[1]">
            <span className="block mb-3.5 text-[10px] font-semibold tracking-[3px] uppercase text-[#71717A] text-center lg:text-right">
              {t('checkoutLabel')}
            </span>
            <div className="flex flex-col sm:flex-row gap-3.5 mb-4">
              <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-md px-7 py-5 text-center hover:border-[rgba(139,92,246,0.25)] transition-colors duration-300 cursor-pointer">
                <div className="text-[11px] font-semibold text-[#71717A] tracking-[0.5px] mb-1">
                  {t('smallAmount')}
                </div>
                <div className="font-display text-xl font-normal" data-testid="credit-price-small">
                  {t('smallPrice')}
                </div>
              </div>
              <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-md px-7 py-5 text-center hover:border-[rgba(139,92,246,0.25)] transition-colors duration-300 cursor-pointer">
                <div className="text-[11px] font-semibold text-[#71717A] tracking-[0.5px] mb-1">
                  {t('largeAmount')}
                </div>
                <div className="font-display text-xl font-normal" data-testid="credit-price-large">
                  {t('largePrice')}
                </div>
              </div>
            </div>
            <a
              href="#"
              className="w-full inline-flex items-center justify-center gap-2.5 px-8 py-4 text-xs font-semibold tracking-[1.5px] uppercase bg-brand text-white rounded-[3px] hover:bg-brand-hover hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(139,92,246,0.35)] transition-all duration-400"
            >
              {t('buyCredits')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
