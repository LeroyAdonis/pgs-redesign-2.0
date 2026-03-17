'use client';

/**
 * ToneSliders — Interactive range sliders for the 6 tone dimensions
 *
 * Each slider ranges 0–1 with visual gradient feedback and labels.
 */

import { cn } from '@/lib/utils';
import type { ToneFingerprint } from '@/lib/brand/types';

interface ToneSlidersProps {
  tone: ToneFingerprint;
  onChange: (key: keyof ToneFingerprint, value: number) => void;
}

const TONE_CONFIG: Array<{
  key: keyof ToneFingerprint;
  label: string;
  leftLabel: string;
  rightLabel: string;
  color: string;
}> = [
  {
    key: 'formal',
    label: 'Formality',
    leftLabel: 'Informal',
    rightLabel: 'Formal',
    color: 'bg-blue-500',
  },
  {
    key: 'casual',
    label: 'Casualness',
    leftLabel: 'Structured',
    rightLabel: 'Casual',
    color: 'bg-green-500',
  },
  {
    key: 'humorous',
    label: 'Humor',
    leftLabel: 'Serious',
    rightLabel: 'Humorous',
    color: 'bg-yellow-500',
  },
  {
    key: 'professional',
    label: 'Professionalism',
    leftLabel: 'Personal',
    rightLabel: 'Professional',
    color: 'bg-purple-500',
  },
  {
    key: 'inspirational',
    label: 'Inspiration',
    leftLabel: 'Practical',
    rightLabel: 'Inspirational',
    color: 'bg-pink-500',
  },
  {
    key: 'educational',
    label: 'Educational',
    leftLabel: 'Entertaining',
    rightLabel: 'Educational',
    color: 'bg-cyan-500',
  },
];

export function ToneSliders({ tone, onChange }: ToneSlidersProps) {
  return (
    <div className="space-y-5">
      {TONE_CONFIG.map(({ key, label, leftLabel, rightLabel, color }) => {
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
