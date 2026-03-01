/**
 * PostingCadenceChart — Visual display of optimal posting times
 *
 * Server component. Shows best day/time and posts per week
 * with a simple visual schedule grid.
 */

import { cn } from '@/lib/utils';
import type { PostingCadence } from '@/lib/brand/types';

interface PostingCadenceChartProps {
  cadence: PostingCadence;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

export function PostingCadenceChart({ cadence }: PostingCadenceChartProps) {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-surface-inset p-3 text-center">
          <p className="text-2xl font-bold text-brand">{cadence.postsPerWeek}</p>
          <p className="mt-1 text-xs text-text-muted">Posts/Week</p>
        </div>
        <div className="rounded-lg bg-surface-inset p-3 text-center">
          <p className="text-2xl font-bold text-brand">{DAYS[cadence.dayOfWeek]}</p>
          <p className="mt-1 text-xs text-text-muted">Best Day</p>
        </div>
        <div className="rounded-lg bg-surface-inset p-3 text-center">
          <p className="text-2xl font-bold text-brand">
            {formatHour(cadence.hourOfDay)}
          </p>
          <p className="mt-1 text-xs text-text-muted">Best Time (SAST)</p>
        </div>
      </div>

      {/* Day-of-week heatmap */}
      <div>
        <p className="mb-2 text-xs font-medium text-text-muted uppercase tracking-wider">
          Weekly Activity
        </p>
        <div className="flex gap-1">
          {DAYS.map((day, i) => {
            const isActive = i === cadence.dayOfWeek;
            return (
              <div
                key={day}
                className={cn(
                  'flex-1 rounded-md py-2 text-center text-xs font-medium',
                  'transition-colors',
                  isActive
                    ? 'bg-brand text-white shadow-glow'
                    : 'bg-surface-inset text-text-muted',
                )}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Optimal posting time visual */}
      <div>
        <p className="mb-2 text-xs font-medium text-text-muted uppercase tracking-wider">
          Best Hours
        </p>
        <div className="flex gap-0.5">
          {Array.from({ length: 24 }, (_, hour) => {
            const isOptimal = Math.abs(hour - cadence.hourOfDay) <= 1;
            const isNear = Math.abs(hour - cadence.hourOfDay) <= 3;

            return (
              <div
                key={hour}
                title={formatHour(hour)}
                className={cn(
                  'flex-1 h-6 rounded-sm',
                  isOptimal
                    ? 'bg-brand'
                    : isNear
                      ? 'bg-brand/30'
                      : 'bg-surface-inset',
                )}
              />
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-text-muted">
          <span>12AM</span>
          <span>6AM</span>
          <span>12PM</span>
          <span>6PM</span>
          <span>12AM</span>
        </div>
      </div>
    </div>
  );
}
