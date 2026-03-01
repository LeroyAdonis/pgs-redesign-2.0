/**
 * ContentStats — Average content length and visual style preferences
 *
 * Server component. Displays key content metrics and color palette.
 */

import { cn } from '@/lib/utils';
import type { VisualStyle } from '@/lib/brand/types';

interface ContentStatsProps {
  avgContentLength: number;
  visualStyle: VisualStyle;
}

export function ContentStats({ avgContentLength, visualStyle }: ContentStatsProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Average Content Length */}
      <div className="rounded-lg bg-surface-inset p-4">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
          Avg. Content Length
        </p>
        <p className="mt-2 text-3xl font-bold text-text">
          {avgContentLength}
        </p>
        <p className="mt-1 text-xs text-text-muted">characters per post</p>
        <div className="mt-3 h-1.5 rounded-full bg-border">
          <div
            className="h-full rounded-full bg-brand"
            style={{ width: `${Math.min((avgContentLength / 300) * 100, 100)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-text-muted">
          <span>Short</span>
          <span>Medium</span>
          <span>Long</span>
        </div>
      </div>

      {/* Color Palette */}
      <div className="rounded-lg bg-surface-inset p-4">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
          Color Palette
        </p>
        <div className="mt-3 flex gap-1.5">
          {visualStyle.colorPalette.map((color, i) => (
            <div
              key={`${color}-${i}`}
              className="h-10 flex-1 rounded-md shadow-sm"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {visualStyle.colorPalette.map((color, i) => (
            <span
              key={`label-${color}-${i}`}
              className="text-[10px] font-mono text-text-muted"
            >
              {color}
            </span>
          ))}
        </div>
      </div>

      {/* Media Preferences */}
      <div className="rounded-lg bg-surface-inset p-4">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
          Media Types
        </p>
        <div className="mt-3 space-y-2">
          {visualStyle.imageTypes.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center',
                  'rounded-md bg-brand-surface text-sm',
                )}
              >
                {type === 'image' ? '🖼️' : type === 'video' ? '🎥' : '🎞️'}
              </span>
              <span className="text-sm capitalize text-text">{type}</span>
            </div>
          ))}
        </div>

        {visualStyle.filterPreferences.length > 0 && (
          <>
            <p className="mt-4 text-xs font-medium text-text-muted uppercase tracking-wider">
              Filter Preferences
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {visualStyle.filterPreferences.map((filter) => (
                <span
                  key={filter}
                  className="rounded-md bg-brand-surface px-2 py-0.5 text-xs text-brand"
                >
                  {filter}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
