'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

/* ─── Types ─── */

type TierKey = 'seedling' | 'hustler' | 'grower' | 'mogul';
type PlatformKey = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';

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
    linkAccounts?: {
      title: string;
      subtitle: string;
      connect: string;
      connected: string;
      skip: string;
    };
    brandScan?: {
      title: string;
      subtitle: string;
      scanning: string;
      complete: string;
      skip: string;
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

const PLATFORMS: { key: PlatformKey; name: string; icon: string; color: string }[] = [
  { key: 'instagram', name: 'Instagram', icon: '📸', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { key: 'facebook', name: 'Facebook', icon: '👤', color: 'bg-blue-600' },
  { key: 'twitter', name: 'X (Twitter)', icon: '𝕏', color: 'bg-neutral-800' },
  { key: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
  { key: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-neutral-900' },
];

const TOTAL_STEPS = 5;

/* ─── Component ─── */

export function OnboardingWizard({ labels, dashboardUrl }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState('');
  const [selectedTier, setSelectedTier] = useState<TierKey>('seedling');
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<PlatformKey>>(new Set());
  const [scanProgress, setScanProgress] = useState(0);
  const [scanRunning, setScanRunning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
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

      // Move to LinkAccounts step
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setCreating(false);
    }
  }, [orgName, selectedTier]);

  const handleConnectPlatform = useCallback(async (platform: PlatformKey) => {
    // Open OAuth flow in a new window
    window.open(`/api/social/connect/${platform}`, '_blank', 'width=600,height=700');
    // Optimistically mark as connected (real flow would use a callback)
    setConnectedPlatforms((prev) => new Set(prev).add(platform));
  }, []);

  const handleBrandScan = useCallback(async () => {
    setScanRunning(true);
    setScanProgress(0);

    try {
      const res = await fetch('/api/onboarding/brand-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName: orgName.trim() }),
      });

      if (!res.ok) {
        throw new Error('Brand scan failed');
      }

      // Simulate progress for UX (real scan runs server-side)
      const interval = setInterval(() => {
        setScanProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            return 100;
          }
          return p + Math.random() * 15;
        });
      }, 400);

      // Wait for scan to complete
      await res.json();
      clearInterval(interval);
      setScanProgress(100);
      setScanComplete(true);
    } catch {
      setError('Brand scan encountered an issue. You can continue and run it later.');
      setScanComplete(true);
    } finally {
      setScanRunning(false);
    }
  }, [orgName]);

  // Auto-start brand scan when arriving at the step
  useEffect(() => {
    if (step === 3 && !scanRunning && !scanComplete) {
      handleBrandScan();
    }
  }, [step, scanRunning, scanComplete, handleBrandScan]);

  const linkAccountsLabels = labels.linkAccounts ?? {
    title: 'Connect Your Accounts',
    subtitle: 'Link your social media platforms to start publishing',
    connect: 'Connect',
    connected: 'Connected',
    skip: 'Skip for now',
  };

  const brandScanLabels = labels.brandScan ?? {
    title: 'Scanning Your Brand',
    subtitle: 'We\'re analyzing your online presence to personalize your experience',
    scanning: 'Scanning...',
    complete: 'Scan complete!',
    skip: 'Skip for now',
  };

  return (
    <div className="flex flex-col" data-testid="onboarding-wizard">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
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
            .replace('{total}', String(TOTAL_STEPS))}
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

      {/* Step 2: Link Accounts */}
      {step === 2 && (
        <div className="py-4">
          <h2 className="text-center font-display text-2xl font-bold text-text">
            {linkAccountsLabels.title}
          </h2>
          <p className="mt-2 text-center text-sm text-text-muted">
            {linkAccountsLabels.subtitle}
          </p>

          <div className="mt-6 grid gap-3">
            {PLATFORMS.map((platform) => {
              const isConnected = connectedPlatforms.has(platform.key);
              return (
                <div
                  key={platform.key}
                  className={cn(
                    'flex items-center gap-4 rounded-lg border p-4 transition-all',
                    isConnected
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-border bg-surface-raised',
                  )}
                >
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg text-white text-lg', platform.color)}>
                    {platform.icon}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-text">{platform.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleConnectPlatform(platform.key)}
                    disabled={isConnected}
                    className={cn(
                      'rounded-md px-4 py-2 text-xs font-semibold transition-colors',
                      isConnected
                        ? 'bg-green-500/10 text-green-500 cursor-default'
                        : 'bg-brand text-white hover:bg-brand/90',
                    )}
                  >
                    {isConnected ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {linkAccountsLabels.connected}
                      </span>
                    ) : (
                      linkAccountsLabels.connect
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-border px-4 py-4 text-sm font-medium text-text transition-colors hover:bg-surface-raised"
            >
              {labels.navigation.back}
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-[2] bg-brand px-4 py-4 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
            >
              {connectedPlatforms.size > 0 ? labels.navigation.next : linkAccountsLabels.skip}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Brand Scan */}
      {step === 3 && (
        <div className="py-4">
          <h2 className="text-center font-display text-2xl font-bold text-text">
            {brandScanLabels.title}
          </h2>
          <p className="mt-2 text-center text-sm text-text-muted">
            {brandScanLabels.subtitle}
          </p>

          <div className="mt-10 flex flex-col items-center">
            {/* Progress ring */}
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="4" className="text-surface-inset" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="text-brand transition-all duration-500"
                  strokeDasharray={`${Math.min(scanProgress, 100) * 3.267} 326.7`}
                />
              </svg>
              <span className="font-display text-2xl font-bold text-text">
                {Math.min(Math.round(scanProgress), 100)}%
              </span>
            </div>

            <p className="mt-6 text-sm text-text-muted">
              {scanComplete ? brandScanLabels.complete : brandScanLabels.scanning}
            </p>

            {/* Scan activity indicators */}
            {!scanComplete && (
              <div className="mt-6 space-y-2 w-full max-w-[280px]">
                {[
                  { label: 'Analyzing social profiles', done: scanProgress > 30 },
                  { label: 'Detecting brand voice', done: scanProgress > 60 },
                  { label: 'Building content strategy', done: scanProgress > 85 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs">
                    {item.done ? (
                      <svg className="h-3.5 w-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border animate-pulse" />
                    )}
                    <span className={cn('transition-colors', item.done ? 'text-text' : 'text-text-muted')}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-10 flex gap-3">
            <button
              onClick={() => {
                setStep(2);
                setScanProgress(0);
                setScanComplete(false);
                setScanRunning(false);
              }}
              className="flex-1 border border-border px-4 py-4 text-sm font-medium text-text transition-colors hover:bg-surface-raised"
            >
              {labels.navigation.back}
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={scanRunning && !scanComplete}
              className="flex-[2] bg-brand px-4 py-4 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
            >
              {scanComplete ? labels.navigation.next : brandScanLabels.skip}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 4 && (
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
