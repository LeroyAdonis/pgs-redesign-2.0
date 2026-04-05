import { useTranslations } from 'next-intl';

/**
 * "From Chaos to Order" — 3-step process section.
 *
 * Server component. Matches the process section from index-v2.html.
 */

const STEPS = ['connect', 'generate', 'publish'] as const;
const STEP_NUMBERS = ['01', '02', '03'] as const;

export function ProcessSection() {
  const t = useTranslations('landing.process');

  return (
    <section id="process" className="py-[100px] lg:py-[140px] border-t border-border">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8">
        {/* Header */}
        <div className="mb-24">
          <span className="block mb-5 text-[10px] font-semibold tracking-[3px] uppercase text-text-muted">
            {t('label')}
          </span>
          <h2 className="font-display text-[clamp(40px,5vw,64px)] font-normal leading-[1.1] tracking-[-0.025em]">
            <em>{t('titlePrefix')}</em>{' '}
            <span className="text-brand">{t('titleHighlight')}</span>
          </h2>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {STEPS.map((step, i) => (
            <div key={step} className="relative">
              <div className="flex items-end gap-2 font-display text-[72px] font-normal text-[rgba(139,92,246,0.08)] leading-none mb-6">
                {STEP_NUMBERS[i]}
                <span className="flex-1 h-px bg-gradient-to-r from-[rgba(255,255,255,0.06)] to-transparent mb-3.5" />
              </div>
              <h3 className="font-display text-[22px] font-normal italic mb-4">
                {t(`${step}.title`)}
              </h3>
              <p className="text-[13px] leading-[1.85] text-text-muted font-light">
                {t(`${step}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
