'use client';

/**
 * ToneSliders — Interactive range sliders for the 6 tone dimensions
 *
 * Each slider ranges 0–1 with visual gradient feedback and labels.
 */

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { ToneFingerprint } from '@/lib/brand/types';

interface ToneSlidersProps {
  tone: ToneFingerprint;
  onChange: (key: keyof ToneFingerprint, value: number) => void;
}

const TONE_CONFIG: Array<{
  key: keyof ToneFingerprint;
  labelKey: string;
  leftKey: string;
  rightKey: string;
  color: string;
}> = [
  {
    key: 'formal',
    labelKey: 'brand.toneFormality',
    leftKey: 'brand.toneFormalityLeft',
    rightKey: 'brand.toneFormalityRight',
    color: 'bg-blue-500',
  },
  {
    key: 'casual',
    labelKey: 'brand.toneCasualness',
    leftKey: 'brand.toneCasualnessLeft',
    rightKey: 'brand.toneCasualnessRight',
    color: 'bg-green-500',
  },
  {
    key: 'humorous',
    labelKey: 'brand.toneHumor',
    leftKey: 'brand.toneHumorLeft',
    rightKey: 'brand.toneHumorRight',
    color: 'bg-yellow-500',
  },
  {
    key: 'professional',
    labelKey: 'brand.toneProfessionalism',
    leftKey: 'brand.toneProfessionalismLeft',
    rightKey: 'brand.toneProfessionalismRight',
    color: 'bg-purple-500',
  },
  {
    key: 'inspirational',
    labelKey: 'brand.toneInspiration',
    leftKey: 'brand.toneInspirationLeft',
    rightKey: 'brand.toneInspirationRight',
    color: 'bg-pink-500',
  },
  {
    key: 'educational',
    labelKey: 'brand.toneEducational',
    leftKey: 'brand.toneEducationalLeft',
    rightKey: 'brand.toneEducationalRight',
    color: 'bg-cyan-500',
  },
];

export function ToneSliders({ tone, onChange }: ToneSlidersProps) {
  const t = useTranslations('dashboard');
  return (
    <div className="space-y-5">
      {TONE_CONFIG.map(({ key, labelKey, leftKey, rightKey, color }) => {
        const label = t(labelKey as Parameters<typeof t>[0]);
        const leftLabel = t(leftKey as Parameters<typeof t>[0]);
        const rightLabel = t(rightKey as Parameters<typeof t>[0]);
        const value = tone[key];
        const percentage = Math.round(value * 100);

        return (
          <div key={key}>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor={`tone-${key}`}
                className="text-sm font-medium text-text"
              >
                {label}
              </label>
              <span className="text-xs font-mono text-text-muted">
                {percentage}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-20 text-right text-xs text-text-muted">
                {leftLabel}
              </span>

              <div className="relative flex-1">
                <input
                  id={`tone-${key}`}
                  type="range"
                  min={0}
                  max={100}
                  value={percentage}
                  onChange={(e) =>
                    onChange(key, Number(e.target.value) / 100)
                  }
                  className={cn(
                    'w-full appearance-none h-2 rounded-full cursor-pointer',
                    'bg-surface-inset',
                    '[&::-webkit-slider-thumb]:appearance-none',
                    '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4',
                    '[&::-webkit-slider-thumb]:rounded-full',
                    '[&::-webkit-slider-thumb]:bg-brand',
                    '[&::-webkit-slider-thumb]:shadow-glow',
                    '[&::-webkit-slider-thumb]:cursor-pointer',
                    '[&::-webkit-slider-thumb]:transition-transform',
                    '[&::-webkit-slider-thumb]:hover:scale-125',
                  )}
                  aria-label={`${label}: ${percentage}%`}
                />
                {/* Track fill */}
                <div
                  className={cn(
                    'absolute top-0 left-0 h-2 rounded-full pointer-events-none',
                    color,
                    'opacity-60',
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <span className="w-20 text-xs text-text-muted">
                {rightLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
