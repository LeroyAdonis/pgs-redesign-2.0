import { useTranslations } from 'next-intl';

/**
 * "Voice of the Industry" — SA testimonials with avatar placeholders.
 *
 * Server component. Matches the testimonials section from index-v2.html.
 */

const TESTIMONIAL_KEYS = ['thabo', 'zanele', 'pieter'] as const;

export function TestimonialsSection() {
  const t = useTranslations('landing.testimonials');

  return (
    <section id="stories" className="py-[100px] lg:py-[140px] bg-[#0F0F13] relative">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.06)] to-transparent" />

      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8">
        {/* Header */}
        <div className="text-center mb-[72px]">
          <h2 className="font-display text-[clamp(36px,4.5vw,56px)] font-normal leading-[1.1]">
            <em>{t('titlePrefix')}</em>{' '}
            <span className="text-brand">{t('titleHighlight')}</span>
          </h2>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {TESTIMONIAL_KEYS.map((key) => (
            <div
              key={key}
              className="bg-[#131318] border border-[rgba(255,255,255,0.06)] rounded-lg px-8 py-10 flex flex-col transition-all duration-500 hover:border-[rgba(139,92,246,0.25)] hover:-translate-y-1"
            >
              {/* Quote icon */}
              <div className="font-display text-[56px] text-brand leading-[0.8] mb-6 opacity-70" aria-hidden="true">
                &ldquo;
              </div>

              {/* Quote text */}
              <p className="text-[15px] leading-[1.8] text-[#A1A1AA] font-light flex-1 mb-8">
                &ldquo;{t(`${key}.quote`)}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3.5 pt-6 border-t border-[rgba(255,255,255,0.06)]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3F3F46] to-[#18181B] shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-[13px] font-semibold tracking-[0.3px]">
                    {t(`${key}.name`)}
                  </div>
                  <div className="text-[11px] text-[#71717A] tracking-[0.5px] mt-0.5">
                    {t(`${key}.role`)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
