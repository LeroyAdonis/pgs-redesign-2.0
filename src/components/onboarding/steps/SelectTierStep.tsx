'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

/* ─── Tier Metadata ─── */

type TierKey = 'seedling' | 'hustler' | 'grower' | 'mogul';

interface TierInfo {
  key: TierKey;
  icon: string;
  color: string;
}

const TIERS: TierInfo[] = [
  { key: 'seedling', icon: '🌱', color: 'text-green-600' },
  { key: 'hustler', icon: '🔥', color: 'text-orange-500' },
  { key: 'grower', icon: '🚀', color: 'text-blue-500' },
  { key: 'mogul', icon: '👑', color: 'text-yellow-500' },
];

/* ─── Types ─── */

interface SelectTierStepProps {
  labels: {
    title: string;
    subtitle: string;
    free: string;
    popular: string;
    tierNames: Record<TierKey, string>;
    tierDescriptions: Record<TierKey, string>;
  };
  selectedTier: TierKey;
  onSelectTier: (tier: TierKey) => void;
}

/* ─── Component ─── */

export function SelectTierStep({
  labels,
  selectedTier,
  onSelectTier,
}: SelectTierStepProps) {
  return (
    <div className="py-4">
      <h2 className="text-center font-display text-2xl font-bold text-text">
        {labels.title}
      </h2>
      <p className="mt-2 text-center text-sm text-text-muted">
        {labels.subtitle}
      </p>

      <div className="mt-6 grid gap-3">
        {TIERS.map((tier) => {
          const isSelected = selectedTier === tier.key;
          return (
            <button
              key={tier.key}
              type="button"
              onClick={() => onSelectTier(tier.key)}
              className={cn(
                'flex items-center gap-4 rounded-lg border p-4 text-left transition-all',
                isSelected
                  ? 'border-brand bg-brand-surface shadow-glow'
                  : 'border-border bg-surface-raised hover:border-brand/30 hover:bg-brand-surface/50',
              )}
              aria-pressed={isSelected}
            >
              <span className="text-2xl" aria-hidden="true">
                {tier.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-body text-sm font-semibold text-text">
                    {labels.tierNames[tier.key]}
                  </span>
                  {tier.key === 'seedling' && (
                    <Badge variant="success" size="sm">{labels.free}</Badge>
                  )}
                  {tier.key === 'grower' && (
                    <Badge variant="brand" size="sm">{labels.popular}</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-text-muted">
                  {labels.tierDescriptions[tier.key]}
                </p>
              </div>
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  isSelected
                    ? 'border-brand bg-brand'
                    : 'border-border',
                )}
              >
                {isSelected && (
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
