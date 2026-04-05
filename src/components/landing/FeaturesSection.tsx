import { useTranslations } from 'next-intl';

/**
 * "The Edition" features section — large card + 2 smaller cards grid.
 *
 * Server component. Matches the edition section from index-v2.html.
 */
export function FeaturesSection() {
  const t = useTranslations('landing.features');

  return (
    <section id="features" className="py-[100px] lg:py-[140px]">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-[72px]">
          <h2 className="font-display text-[clamp(40px,5vw,64px)] font-normal leading-[1.1] tracking-[-0.025em]">
            <span className="text-brand">{t('titleThe')}</span>{' '}
            <em>{t('titleEdition')}</em>
          </h2>
          <span className="hidden sm:block text-[10px] font-semibold tracking-[3px] uppercase text-text-muted">
            {t('label')}
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-5">
          {/* Large card */}
          <div className="lg:row-span-2 bg-surface-raised border border-border rounded-lg overflow-hidden flex flex-col transition-all duration-500 hover:border-brand hover:shadow-[0_24px_64px_rgba(0,0,0,0.3),0_0_0_1px_rgba(139,92,246,0.1)] hover:-translate-y-1">
            <div className="w-full aspect-[16/10] bg-gradient-to-br from-[#111118] via-[#1a1528] to-[#12121a] flex items-center justify-center relative overflow-hidden">
              {/* Rotating conic gradient */}
              <div className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] bg-[conic-gradient(from_180deg_at_50%_50%,rgba(139,92,246,0.06)_0deg,transparent_90deg,rgba(139,92,246,0.04)_180deg,transparent_270deg)] animate-[landing-mesh-rotate_20s_linear_infinite]" />
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="0.4" aria-hidden="true" className="relative z-[1]">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <span className="block mb-3.5 text-[10px] font-semibold tracking-[3px] uppercase text-brand">
                {t('engine.label')}
              </span>
              <h3 className="font-display text-[clamp(22px,2.5vw,30px)] font-normal italic leading-[1.25] mb-3.5">
                {t('engine.title')}
              </h3>
              <p className="text-sm leading-[1.8] text-text-secondary font-light">
                {t('engine.description')}
              </p>
            </div>
          </div>

          {/* Small cards stack */}
          <div className="flex flex-col gap-5">
            {/* Multilingual Core */}
            <div className="flex-1 bg-surface-raised border border-border rounded-lg px-8 py-9 flex flex-col justify-end relative overflow-hidden transition-all duration-500 hover:border-brand hover:shadow-[0_24px_64px_rgba(0,0,0,0.3)] hover:-translate-y-1 group">
              <div className="absolute top-[-60px] right-[-60px] w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(139,92,246,0.04),transparent_70%)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="block mb-3.5 text-[10px] font-semibold tracking-[3px] uppercase text-brand">
                {t('multilingual.label')}
              </span>
              <h3 className="font-display text-[clamp(22px,2.5vw,30px)] font-normal italic leading-[1.25] mb-3.5">
                {t('multilingual.title')}
              </h3>
              <p className="text-sm leading-[1.8] text-text-secondary font-light">
                {t('multilingual.description')}
              </p>
            </div>

            {/* Smart Scheduling */}
            <div className="flex-1 bg-surface-raised border border-border rounded-lg px-8 py-9 flex flex-col justify-end relative overflow-hidden transition-all duration-500 hover:border-brand hover:shadow-[0_24px_64px_rgba(0,0,0,0.3)] hover:-translate-y-1 group">
              <div className="absolute top-[-60px] right-[-60px] w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(139,92,246,0.04),transparent_70%)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="block mb-3.5 text-[10px] font-semibold tracking-[3px] uppercase text-brand">
                {t('scheduling.label')}
              </span>
              <h3 className="font-display text-[clamp(22px,2.5vw,30px)] font-normal italic leading-[1.25] mb-3.5">
                {t('scheduling.title')}
              </h3>
              <p className="text-sm leading-[1.8] text-text-secondary font-light">
                {t('scheduling.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
