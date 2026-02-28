import { useTranslations } from 'next-intl';

/**
 * Landing page footer — 5-column grid with brand, sitemap, features, legal, social.
 *
 * Server component. Matches the footer design from index-v2.html.
 */
export function LandingFooter() {
  const t = useTranslations('landing');

  return (
    <footer className="pt-[72px] pb-9 border-t border-[rgba(255,255,255,0.06)]">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8">
        {/* Footer grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-9 lg:gap-12 mb-14">
          {/* Brand column */}
          <div>
            <a href="#" className="flex items-center gap-2.5 text-[13px] font-bold tracking-[2.5px] uppercase text-[#F5F5F7]">
              <span className="w-[3px] h-5 bg-brand rounded-sm" />
              Purple Glow
            </a>
            <p className="text-xs text-[#3F3F46] leading-[1.8] max-w-[220px] mt-4">
              {t('footer.brandDescription')}
            </p>
          </div>

          {/* Sitemap */}
          <div>
            <h4 className="text-[10px] font-semibold tracking-[2.5px] uppercase text-[#71717A] mb-5">
              {t('footer.sitemap')}
            </h4>
            <a href="#features" className="block text-[13px] text-[#3F3F46] py-[5px] font-light hover:text-[#F5F5F7] transition-colors duration-300">
              {t('navbar.features')}
            </a>
            <a href="#process" className="block text-[13px] text-[#3F3F46] py-[5px] font-light hover:text-[#F5F5F7] transition-colors duration-300">
              {t('footer.mediaWorks')}
            </a>
            <a href="#" className="block text-[13px] text-[#3F3F46] py-[5px] font-light hover:text-[#F5F5F7] transition-colors duration-300">
              {t('footer.login')}
            </a>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-[10px] font-semibold tracking-[2.5px] uppercase text-[#71717A] mb-5">
              {t('footer.featuresCol')}
            </h4>
            <a href="#" className="block text-[13px] text-[#3F3F46] py-[5px] font-light hover:text-[#F5F5F7] transition-colors duration-300">
              {t('footer.aiContent')}
            </a>
            <a href="#" className="block text-[13px] text-[#3F3F46] py-[5px] font-light hover:text-[#F5F5F7] transition-colors duration-300">
              {t('footer.scheduling')}
            </a>
            <a href="#" className="block text-[13px] text-[#3F3F46] py-[5px] font-light hover:text-[#F5F5F7] transition-colors duration-300">
              {t('footer.analytics')}
            </a>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[10px] font-semibold tracking-[2.5px] uppercase text-[#71717A] mb-5">
              {t('footer.legal')}
            </h4>
            <a href="#" className="block text-[13px] text-[#3F3F46] py-[5px] font-light hover:text-[#F5F5F7] transition-colors duration-300">
              {t('footer.privacyPolicy')}
            </a>
            <a href="#" className="block text-[13px] text-[#3F3F46] py-[5px] font-light hover:text-[#F5F5F7] transition-colors duration-300">
              {t('footer.termsOfService')}
            </a>
            <a href="#" className="block text-[13px] text-[#3F3F46] py-[5px] font-light hover:text-[#F5F5F7] transition-colors duration-300">
              {t('footer.fairPractices')}
            </a>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-[10px] font-semibold tracking-[2.5px] uppercase text-[#71717A] mb-5">
              {t('footer.social')}
            </h4>
            <div className="flex gap-[18px]">
              <a href="#" aria-label="Twitter" className="text-[#3F3F46] hover:text-[#F5F5F7] hover:-translate-y-0.5 transition-all duration-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a href="#" aria-label="Instagram" className="text-[#3F3F46] hover:text-[#F5F5F7] hover:-translate-y-0.5 transition-all duration-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-7 border-t border-[rgba(255,255,255,0.06)]">
          <span className="text-[10px] text-[#3F3F46] tracking-[1.5px] uppercase">
            {t('footer.copyright')}
          </span>
        </div>
      </div>
    </footer>
  );
}
