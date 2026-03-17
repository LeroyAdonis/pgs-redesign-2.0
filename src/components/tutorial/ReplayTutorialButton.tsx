'use client';

import { useTranslations } from 'next-intl';
import { useTutorial } from './TutorialProvider';

/**
 * Small client wrapper that triggers the tutorial overlay.
 * Used on the docs/getting-started page for replaying the tutorial.
 */
export function ReplayTutorialButton() {
  const t = useTranslations('tutorial');
  const { showTutorial } = useTutorial();

  return (
    <button
      onClick={showTutorial}
      className={[
        'inline-flex items-center gap-2 rounded-lg',
        'bg-purple-600 px-5 py-2.5 text-sm font-medium text-white',
        'transition-all duration-150',
        'hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/20',
      ].join(' ')}
      data-testid="replay-tutorial-button"
    >
      <span aria-hidden="true">🎓</span>
      {t('replay')}
    </button>
  );
}
