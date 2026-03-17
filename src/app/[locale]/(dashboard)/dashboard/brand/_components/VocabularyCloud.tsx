/**
 * VocabularyCloud — Tag-style display of vocabulary clusters
 *
 * Server component (no interactivity needed). Shows word groups
 * by category with frequency-based sizing.
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import type { VocabularyCluster } from '@/lib/brand/types';

interface VocabularyCloudProps {
  clusters: VocabularyCluster[];
}

const CATEGORY_COLORS: Record<string, string> = {
  business: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  community: 'bg-green-500/10 text-green-400 border-green-500/20',
  lifestyle: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  technology: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  action: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  other: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;
}

export function VocabularyCloud({ clusters }: VocabularyCloudProps) {
  if (clusters.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No vocabulary data yet. Run a brand scan to get started.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {clusters.map((cluster) => (
        <div key={cluster.category}>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="default" size="sm">
              {cluster.category}
            </Badge>
            <span className="text-xs text-text-muted">
              {cluster.frequency} uses
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {cluster.words.map((word) => (
              <span
                key={word}
                className={cn(
                  'inline-flex items-center rounded-none border px-2 py-0.5',
                  'text-xs font-medium',
                  getCategoryColor(cluster.category),
                )}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
