import { useTranslations } from 'next-intl';

/**
 * Infinite scrolling marquee — brand phrases with purple dot separators.
 *
 * Server component. CSS animation drives the scroll.
 * Content is duplicated to create a seamless loop effect.
 */
export function MarqueeSection() {
  const t = useTranslations('landing.marquee');

  const items = [
    t('liquidIntelligence'),
    t('automatedCreativity'),
    t('editorialStandards'),
    t('masterCreators'),
  ];

  // Duplicate items enough times to fill the viewport and create seamless loop
  const repeatedItems = [...items, ...items, ...items];

  return (
    <section className="py-7 border-t border-b border-[rgba(255,255,255,0.06)] overflow-hidden relative">
      {/* Fade edges */}
      <div className="absolute top-0 bottom-0 left-0 w-[120px] z-[2] pointer-events-none bg-gradient-to-r from-[#08080B] to-transparent" />
      <div className="absolute top-0 bottom-0 right-0 w-[120px] z-[2] pointer-events-none bg-gradient-to-l from-[#08080B] to-transparent" />

      <div className="flex w-max animate-[landing-marquee_35s_linear_infinite]">
        {repeatedItems.map((text, i) => (
          <span
            key={`${text}-${i}`}
            className="flex items-center gap-10 px-10 whitespace-nowrap text-[13px] font-normal tracking-[1.5px] text-[#71717A]"
          >
            <span className="w-1 h-1 rounded-full bg-brand shrink-0" aria-hidden="true" />
            {text}
          </span>
        ))}
      </div>
    </section>
  );
}
