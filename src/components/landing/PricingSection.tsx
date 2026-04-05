'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';

/**
 * Membership pricing section with Monthly/Annual toggle.
 *
 * Client component: toggle state drives price display.
 * Matches the membership section from index-v2.html.
 */

interface PricingTier {
  key: 'hustle' | 'creator' | 'mogul';
  preferred: boolean;
  ctaKey: 'selectPlan' | 'joinNow' | 'contactSales';
  ctaVariant: 'outline' | 'primary' | 'outline';
  features: string[];
}

const TIERS: PricingTier[] = [
  {
    key: 'hustle',
    preferred: false,
    ctaKey: 'selectPlan',
    ctaVariant: 'outline',
    features: ['feature1', 'feature2', 'feature3'],
  },
  {
    key: 'creator',
    preferred: true,
    ctaKey: 'joinNow',
    ctaVariant: 'primary',
    features: ['feature1', 'feature2', 'feature3', 'feature4'],
  },
  {
    key: 'mogul',
    preferred: false,
    ctaKey: 'contactSales',
    ctaVariant: 'outline',
    features: ['feature1', 'feature2', 'feature3', 'feature4'],
  },
];

export function PricingSection() {
  const t = useTranslations('landing.pricing');
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="membership" className="py-[100px] lg:py-[140px]">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-baseline justify-between gap-6 mb-[72px]">
          <h2 className="font-display text-[clamp(40px,5vw,56px)] font-normal leading-[1.15]">
            {t('title')}<br />
            <span className="text-brand">{t('titleHighlight')}</span>
          </h2>

          {/* Toggle */}
          <div className="flex gap-0.5 bg-surface-raised border border-border rounded-md p-[3px]">
            <button
              className={cn(
                'px-[22px] py-[9px] text-[11px] font-medium tracking-[0.5px] rounded transition-all duration-300',
                !isAnnual
                  ? 'bg-brand text-white shadow-[0_2px_8px_rgba(139,92,246,0.3)]'
                  : 'text-text-muted',
              )}
              onClick={() => setIsAnnual(false)}
            >
              {t('monthly')}
            </button>
            <button
              className={cn(
                'px-[22px] py-[9px] text-[11px] font-medium tracking-[0.5px] rounded transition-all duration-300',
                isAnnual
                  ? 'bg-brand text-white shadow-[0_2px_8px_rgba(139,92,246,0.3)]'
                  : 'text-text-muted',
              )}
              onClick={() => setIsAnnual(true)}
            >
              {t('annually')}
            </button>
          </div>
        </div>

        {/* Pricing grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-[480px] lg:max-w-none mx-auto lg:mx-0 items-start">
          {TIERS.map((tier) => (
            <div
              key={tier.key}
              className={cn(
                'bg-surface-raised border rounded-lg px-9 py-11 relative transition-all duration-500 hover:shadow-[0_24px_64px_rgba(0,0,0,0.3)] hover:-translate-y-1.5',
                tier.preferred
                  ? 'border-brand hover:border-brand'
                  : 'border-border hover:border-brand',
              )}
            >
              {/* Preferred badge */}
              {tier.preferred && (
                <div className="absolute -top-px right-7 bg-brand text-white text-[9px] font-bold tracking-[2.5px] px-4 py-1.5 rounded-b-md">
                  {t('preferred')}
                </div>
              )}

              {/* Tier name */}
              <div className={cn(
                'text-[10px] font-semibold tracking-[3px] uppercase mb-2.5',
                tier.preferred ? 'text-brand' : 'text-text-muted',
              )}>
                {t(`${tier.key}.name`)}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-8" data-testid={`price-${tier.key}`}>
                <span className="font-display text-xl text-text-muted">R</span>
                <span className="font-display text-[52px] font-normal leading-none">
                  {isAnnual ? t(`${tier.key}.priceAnnual`) : t(`${tier.key}.price`)}
                </span>
                <span className="text-[13px] text-text-muted">
                  {isAnnual ? t('periodAnnual') : t('period')}
                </span>
              </div>

              {/* Features list */}
              <ul className="mb-9 space-y-0">
                {tier.features.map((featureKey) => (
                  <li
                    key={featureKey}
                    className="flex items-center gap-3 text-sm text-text-secondary font-light py-[9px]"
                  >
                    <span className="w-[5px] h-[5px] rounded-full bg-brand shrink-0" aria-hidden="true" />
                    {t(`${tier.key}.${featureKey}`)}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/signup"
                className={cn(
                  'w-full inline-flex items-center justify-center gap-2.5 px-8 py-4 text-xs font-semibold tracking-[1.5px] uppercase rounded-[3px] transition-all duration-400',
                  tier.ctaVariant === 'primary'
                    ? 'bg-brand text-white hover:bg-brand-hover hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(139,92,246,0.35)]'
                    : 'bg-transparent text-text-inverse border border-border-strong hover:border-[#A1A1AA] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]',
                )}
              >
                {t(tier.ctaKey)}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
