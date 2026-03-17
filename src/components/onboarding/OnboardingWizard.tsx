'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { WelcomeStep } from '@/components/onboarding/steps/WelcomeStep';
import { SelectTierStep } from '@/components/onboarding/steps/SelectTierStep';
import { LinkAccountStep } from '@/components/onboarding/steps/LinkAccountStep';
import { BrandScanStep } from '@/components/onboarding/steps/BrandScanStep';
import { GeneratePostStep } from '@/components/onboarding/steps/GeneratePostStep';
import { ScheduleStep } from '@/components/onboarding/steps/ScheduleStep';
import { DoneStep } from '@/components/onboarding/steps/DoneStep';

/* ─── Constants ─── */

const TOTAL_STEPS = 7;
const FIRST_STEP = 0;
const LAST_STEP = TOTAL_STEPS - 1;

/** Steps that cannot be skipped */
const NON_SKIPPABLE_STEPS = new Set([0, 6]); // Welcome, Done

type TierKey = 'seedling' | 'hustler' | 'grower' | 'mogul';

/* ─── Types ─── */

export interface OnboardingLabels {
  welcome: {
    title: string;
    subtitle: string;
    getStarted: string;
  };
  selectTier: {
    title: string;
    subtitle: string;
    free: string;
    popular: string;
    tierNames: Record<TierKey, string>;
    tierDescriptions: Record<TierKey, string>;
  };
  linkAccount: {
    title: string;
    subtitle: string;
    connect: string;
    comingSoon: string;
  };
  brandScan: {
    title: string;
    subtitle: string;
    scanning: string;
    features: string[];
  };
  generatePost: {
    title: string;
    subtitle: string;
    prompt: string;
    generate: string;
    mockPost: string;
  };
  schedule: {
    title: string;
    subtitle: string;
    bestTimes: string;
    days: string[];
    timeSlots: string[];
  };
  done: {
    title: string;
    subtitle: string;
    goToDashboard: string;
  };
  navigation: {
    back: string;
    next: string;
    skip: string;
  };
  progress: {
    stepOf: string; // e.g. "Step {current} of {total}"
  };
}

interface OnboardingWizardProps {
  labels: OnboardingLabels;
  dashboardUrl: string;
}

/* ─── Component ─── */

export function OnboardingWizard({ labels, dashboardUrl }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(FIRST_STEP);
  const [selectedTier, setSelectedTier] = useState<TierKey>('seedling');

  const canGoBack = currentStep > FIRST_STEP && currentStep < LAST_STEP;
  const canSkip = !NON_SKIPPABLE_STEPS.has(currentStep);
  const isLastContentStep = currentStep === LAST_STEP - 1;

  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, LAST_STEP));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, FIRST_STEP));
  }, []);

  const handleFinish = useCallback(() => {
    router.push(dashboardUrl);
  }, [router, dashboardUrl]);

  const progressPercent = ((currentStep) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="flex flex-col" data-testid="onboarding-wizard">
      {/* ── Progress indicator ── */}
      <div className="mb-6" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
        {/* Step dots */}
        <div className="flex items-center justify-center gap-2" data-testid="progress-dots">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === currentStep
                  ? 'w-8 bg-brand'
                  : i < currentStep
                    ? 'w-2 bg-brand/60'
                    : 'w-2 bg-surface-inset',
              )}
              aria-hidden="true"
            />
          ))}
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1 w-full rounded-full bg-surface-inset overflow-hidden">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-1 text-center font-mono text-[0.625rem] text-text-muted">
          {labels.progress.stepOf
            .replace('{current}', String(currentStep + 1))
            .replace('{total}', String(TOTAL_STEPS))}
        </p>
      </div>

      {/* ── Step content ── */}
      <div className="min-h-[360px]" data-testid="step-content">
        {currentStep === 0 && (
          <WelcomeStep labels={labels.welcome} onNext={goNext} />
        )}
        {currentStep === 1 && (
          <SelectTierStep
            labels={labels.selectTier}
            selectedTier={selectedTier}
            onSelectTier={setSelectedTier}
          />
        )}
        {currentStep === 2 && (
          <LinkAccountStep labels={labels.linkAccount} />
        )}
        {currentStep === 3 && (
          <BrandScanStep labels={labels.brandScan} />
        )}
        {currentStep === 4 && (
          <GeneratePostStep labels={labels.generatePost} />
        )}
        {currentStep === 5 && (
          <ScheduleStep labels={labels.schedule} />
        )}
        {currentStep === 6 && (
          <DoneStep labels={labels.done} onFinish={handleFinish} />
        )}
      </div>

      {/* ── Navigation buttons ── */}
      {currentStep !== FIRST_STEP && currentStep !== LAST_STEP && (
        <div
          className="mt-6 flex items-center justify-between border-t border-border pt-4"
          data-testid="step-navigation"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            disabled={!canGoBack}
          >
            {labels.navigation.back}
          </Button>

          <div className="flex items-center gap-2">
            {canSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goNext}
                data-testid="skip-button"
              >
                {labels.navigation.skip}
              </Button>
            )}
            <Button
              size="sm"
              onClick={goNext}
              data-testid="next-button"
            >
              {isLastContentStep ? labels.done.goToDashboard : labels.navigation.next}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
