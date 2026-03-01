/**
 * SACulturalBadge — Visual indicator of SA cultural awareness level
 *
 * Server component. Shows a score badge that reflects how much
 * SA cultural content is present in the brand's posts.
 */

import { cn } from '@/lib/utils';

interface SACulturalBadgeProps {
  score: number; // 0–1
}

function getLevel(score: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (score >= 0.8) {
    return { label: 'Proudly SA', color: 'bg-success-surface text-success border-success/30', emoji: '🇿🇦' };
  }
  if (score >= 0.5) {
    return { label: 'SA Aware', color: 'bg-brand-surface text-brand border-brand/30', emoji: '🌍' };
  }
  if (score >= 0.2) {
    return { label: 'Getting There', color: 'bg-warning-surface text-warning border-warning/30', emoji: '📈' };
  }
  return { label: 'Go Local!', color: 'bg-surface-inset text-text-muted border-border', emoji: '💡' };
}

export function SACulturalBadge({ score }: SACulturalBadgeProps) {
  const { label, color, emoji } = getLevel(score);
  const percentage = Math.round(score * 100);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
        color,
      )}
      title={`SA Cultural Awareness: ${percentage}%`}
    >
      <span aria-hidden="true">{emoji}</span>
      <span className="text-xs font-medium">{label}</span>
      <span className="text-xs font-mono opacity-70">{percentage}%</span>
    </div>
  );
}
