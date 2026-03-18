'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

/* ─── Types ─── */

type TierKey = 'seedling' | 'hustler' | 'grower' | 'mogul';

interface OnboardingWizardProps {
  labels: {
    welcome: { title: string; subtitle: string; getStarted: string };
    orgName: { title: string; subtitle: string; placeholder: string; hint: string };
    selectTier: {
      title: string;
      subtitle: string;
      free: string;
      popular: string;
      tierNames: Record<TierKey, string>;
      tierDescriptions: Record<TierKey, string>;
    };
    done: { title: string; subtitle: string; goToDashboard: string };
    navigation: { back: string; next: string; create: string };
    progress: { stepOf: string };
  };
  dashboardUrl: string;
}

const TIERS: { key: TierKey; icon: string; color: string }[] = [
  { key: 'seedling', icon: '🌱', color: 'text-green-600' },
  { key: 'hustler', icon: '🔥', color: 'text-orange-500' },
  { key: 'grower', icon: '🚀', color: 'text-blue-500' },
  { key: 'mogul', icon: '👑', color: 'text-yellow-500' },
];

/* ─── Component ─── */

export function OnboardingWizard({ labels, dashboardUrl }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState('');
  const [selectedTier, setSelectedTier] = useState<TierKey>('seedling');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canProceed = step === 0 ? orgName.trim().length > 0 : true;

  const handleCreate = useCallback(async () => {
    if (!orgName.trim()) {
      setError('Please enter your business name');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName: orgName.trim(),
          tier: selectedTier,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create organization');
      }

      setStep(2); // Done step
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setCreating(false);
    }
  }, [orgName, selectedTier]);

  return (
    <div className="flex flex-col" data-testid="onboarding-wizard">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === step ? 'w-8 bg-brand' : i < step ? 'w-2 bg-brand/60' : 'w-2 bg-surface-inset',
              )}
            />
          ))}
        </div>
        <p className="mt-2 text-center font-mono text-[0.625rem] text-text-muted">
          {labels.progress.stepOf
            .replace('{current}', String(step + 1))
            .replace('{total}', '3')}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-error/20 bg-error-surface p-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Step 0: Business Name */}
      {step === 0 && (
        <div className="py-4">
          <h2 className="text-center font-display text-2xl font-bold text-text">
            {labels.welcome.title}
          </h2>
          <p className="mt-2 text-center text-sm text-text-muted">
            {labels.welcome.subtitle}
          </p>

          <div className="mt-8">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-text-muted">
              {labels.orgName.title}
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder={labels.orgName.placeholder}
              className="mt-2 block w-full border border-border bg-surface px-5 py-4 text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              autoFocus
            />
            <p className="mt-2 text-xs text-text-muted">{labels.orgName.hint}</p>
          </div>

          <button
            onClick={() => {
              if (orgName.trim()) {
                setStep(1);
              } else {
                setError('Please enter your business name');
              }
            }}
            disabled={!orgName.trim()}
            className="mt-8 w-full bg-brand px-4 py-4 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
          >
            {labels.navigation.next}
          </button>
        </div>
      )}

      {/* Step 1: Select Tier */}
      {step === 1 && (
        <div className="py-4">
          <h2 className="text-center font-display text-2xl font-bold text-text">
            {labels.selectTier.title}
          </h2>
          <p className="mt-2 text-center text-sm text-text-muted">
            {labels.selectTier.subtitle}
          </p>

          <div className="mt-6 grid gap-3">
            {TIERS.map((tier) => {
              const isSelected = selectedTier === tier.key;
              return (
                <button
                  key={tier.key}
                  type="button"
                  onClick={() => setSelectedTier(tier.key)}
                  className={cn(
                    'flex items-center gap-4 rounded-lg border p-4 text-left transition-all',
                    isSelected
                      ? 'border-brand bg-brand-surface ring-1 ring-brand/20'
                      : 'border-border bg-surface-raised hover:border-border-strong',
                  )}
                >
                  <span className="text-2xl">{tier.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text">
                        {labels.selectTier.tierNames[tier.key]}
                      </span>
                      {tier.key === 'seedling' && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          {labels.selectTier.free}
                        </span>
                      )}
                      {tier.key === 'hustler' && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                          {labels.selectTier.popular}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      {labels.selectTier.tierDescriptions[tier.key]}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                      isSelected ? 'border-brand bg-brand' : 'border-border',
                    )}
                  >
                    {isSelected && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="flex-1 border border-border px-4 py-4 text-sm font-medium text-text transition-colors hover:bg-surface-raised"
            >
              {labels.navigation.back}
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex-[2] bg-brand px-4 py-4 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
            >
              {creating ? 'Creating...' : labels.navigation.create}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Done */}
      {step === 2 && (
        <div className="py-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="mt-6 font-display text-2xl font-bold text-text">
            {labels.done.title}
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            {labels.done.subtitle}
          </p>
          <button
            onClick={() => router.push(dashboardUrl)}
            className="mt-8 w-full bg-brand px-4 py-4 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
          >
            {labels.done.goToDashboard}
          </button>
        </div>
      )}
    </div>
  );
}
