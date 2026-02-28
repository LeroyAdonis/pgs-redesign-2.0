'use client';

import { Spinner } from '@/components/feedback/Spinner';

/* ─── Types ─── */

interface BrandScanStepProps {
  labels: {
    title: string;
    subtitle: string;
    scanning: string;
    features: string[];
  };
}

/* ─── Component ─── */

export function BrandScanStep({ labels }: BrandScanStepProps) {
  return (
    <div className="py-4">
      <h2 className="text-center font-display text-2xl font-bold text-text">
        {labels.title}
      </h2>
      <p className="mt-2 text-center text-sm text-text-muted">
        {labels.subtitle}
      </p>

      {/* Scanning animation placeholder */}
      <div className="mt-8 flex flex-col items-center">
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-brand-surface">
          <Spinner size="lg" />
          <div className="absolute inset-0 animate-ping rounded-full bg-brand-surface opacity-30" />
        </div>
        <p className="mt-4 text-sm font-medium text-brand">
          {labels.scanning}
        </p>
      </div>

      {/* Feature list */}
      <ul className="mt-8 space-y-3">
        {labels.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-text-muted">
            <svg
              className="h-4 w-4 shrink-0 text-brand"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
