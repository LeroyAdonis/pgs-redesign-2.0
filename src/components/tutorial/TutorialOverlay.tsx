'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useTutorial } from './TutorialProvider';

/* ─── Step definitions ─── */

interface TutorialStep {
  /** i18n key suffix (e.g. "step1") */
  key: string;
  /** Emoji icon for the step */
  icon: string;
}

const STEPS: TutorialStep[] = [
  { key: 'step1', icon: '📊' },
  { key: 'step2', icon: '✨' },
  { key: 'step3', icon: '📅' },
  { key: 'step4', icon: '📈' },
  { key: 'step5', icon: '⚙️' },
];

const TOTAL_STEPS = STEPS.length;
const FIRST_STEP = 0;
const LAST_STEP = TOTAL_STEPS - 1;

/* ─── Component ─── */

export function TutorialOverlay() {
  const t = useTranslations('tutorial');
  const { isTutorialVisible, hideTutorial } = useTutorial();

  const [currentStep, setCurrentStep] = useState(FIRST_STEP);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [prevVisible, setPrevVisible] = useState(isTutorialVisible);

  // Reset step when overlay opens (set state during render — React recommended pattern)
  if (isTutorialVisible !== prevVisible) {
    setPrevVisible(isTutorialVisible);
    if (isTutorialVisible) {
      setCurrentStep(FIRST_STEP);
    }
  }

  const animateTransition = useCallback((direction: 'left' | 'right', callback: () => void) => {
    setSlideDirection(direction);
    setIsAnimating(true);
    // Brief delay for exit animation, then switch step
    const timer = setTimeout(() => {
      callback();
      setIsAnimating(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const goNext = useCallback(() => {
    if (currentStep < LAST_STEP) {
      animateTransition('right', () => setCurrentStep((prev) => prev + 1));
    }
  }, [currentStep, animateTransition]);

  const goBack = useCallback(() => {
    if (currentStep > FIRST_STEP) {
      animateTransition('left', () => setCurrentStep((prev) => prev - 1));
    }
  }, [currentStep, animateTransition]);

  const handleFinish = useCallback(() => {
    hideTutorial();
  }, [hideTutorial]);

  const handleSkip = useCallback(() => {
    hideTutorial();
  }, [hideTutorial]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isTutorialVisible) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' && currentStep < LAST_STEP) {
        goNext();
      } else if (e.key === 'ArrowLeft' && currentStep > FIRST_STEP) {
        goBack();
      } else if (e.key === 'Enter' && currentStep === LAST_STEP) {
        handleFinish();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isTutorialVisible, currentStep, goNext, goBack, handleFinish, handleSkip]);

  if (!isTutorialVisible) return null;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === LAST_STEP;
  const isFirstStep = currentStep === FIRST_STEP;
  const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
      data-testid="tutorial-overlay"
    >
      {/* Card */}
      <div
        className={cn(
          'relative mx-4 w-full max-w-lg',
          'rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl',
          'animate-in zoom-in-95 fade-in duration-300',
        )}
        data-testid="tutorial-card"
      >
        {/* Skip button — top right */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 text-sm text-slate-400 transition-colors hover:text-white"
          data-testid="tutorial-skip"
        >
          {t('skip')}
        </button>

        {/* Step content */}
        <div className="px-8 pb-6 pt-10">
          {/* Welcome header (only on first step) */}
          {isFirstStep && (
            <p className="mb-4 text-center text-sm text-purple-400">
              {t('welcome')}
            </p>
          )}

          {/* Step illustration */}
          <div
            className={cn(
              'mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full',
              'bg-gradient-to-br from-purple-600/30 to-purple-900/30',
              'ring-1 ring-purple-500/20',
              'transition-all duration-200',
              isAnimating && slideDirection === 'right' && 'translate-x-2 opacity-0',
              isAnimating && slideDirection === 'left' && '-translate-x-2 opacity-0',
            )}
            aria-hidden="true"
            data-testid="tutorial-icon"
          >
            <span className="text-4xl">{step.icon}</span>
          </div>

          {/* Step counter */}
          <p className="mb-2 text-center font-mono text-xs text-slate-500" data-testid="tutorial-progress-text">
            {t('progress', { current: currentStep + 1, total: TOTAL_STEPS })}
          </p>

          {/* Step title & description */}
          <div
            className={cn(
              'text-center transition-all duration-200',
              isAnimating && 'opacity-0',
            )}
          >
            <h2 className="mb-2 text-xl font-bold text-white" data-testid="tutorial-step-title">
              {t(`${step.key}.title`)}
            </h2>
            <p className="text-sm leading-relaxed text-slate-400" data-testid="tutorial-step-description">
              {t(`${step.key}.description`)}
            </p>
          </div>

          {/* Progress dots */}
          <div
            className="mt-6 flex items-center justify-center gap-2"
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
            data-testid="tutorial-progress-dots"
          >
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === currentStep
                    ? 'w-6 bg-purple-500'
                    : i < currentStep
                      ? 'w-2 bg-purple-500/50'
                      : 'w-2 bg-slate-600',
                )}
                aria-hidden="true"
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-purple-500 transition-[width] duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Navigation */}
        <div
          className="flex items-center justify-between border-t border-slate-700 px-8 py-4"
          data-testid="tutorial-navigation"
        >
          {/* Previous button */}
          <button
            onClick={goBack}
            disabled={isFirstStep}
            className={cn(
              'rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300',
              'transition-all duration-150',
              isFirstStep
                ? 'cursor-not-allowed opacity-30'
                : 'hover:border-slate-500 hover:text-white',
            )}
            data-testid="tutorial-previous"
          >
            {t('previous')}
          </button>

          {/* Next / Finish button */}
          {isLastStep ? (
            <button
              onClick={handleFinish}
              className={cn(
                'rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white',
                'transition-all duration-150',
                'hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/20',
              )}
              data-testid="tutorial-finish"
            >
              {t('finish')}
            </button>
          ) : (
            <button
              onClick={goNext}
              className={cn(
                'rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white',
                'transition-all duration-150',
                'hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/20',
              )}
              data-testid="tutorial-next"
            >
              {t('next')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
