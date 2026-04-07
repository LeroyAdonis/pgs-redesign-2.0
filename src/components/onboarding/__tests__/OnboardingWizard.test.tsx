import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

/* ─── Mocks ─── */

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/onboarding',
}));

/* ─── Fixture ─── */

const LABELS = {
  welcome: {
    title: 'Welcome to Purple Glow',
    subtitle: 'Let\'s set you up',
    getStarted: 'Get Started',
  },
  orgName: {
    title: 'Organization Name',
    subtitle: 'What should we call your team?',
    placeholder: 'Enter organization name',
    hint: 'You can change this later',
  },
  selectTier: {
    title: 'Choose Your Plan',
    subtitle: 'Pick the tier that fits',
    free: 'Free',
    popular: 'Popular',
    tierNames: { seedling: 'Seedling', hustler: 'Hustler', grower: 'Grower', mogul: 'Mogul' },
    tierDescriptions: {
      seedling: 'Free forever',
      hustler: 'For side hustlers',
      grower: 'Growing brands',
      mogul: 'Enterprise grade',
    },
  },
  linkAccount: {
    title: 'Link Account',
    subtitle: 'Connect your socials',
    connect: 'Connect',
    comingSoon: 'Coming Soon',
  },
  brandScan: {
    title: 'Brand Scan',
    subtitle: 'Analyzing your brand',
    scanning: 'Scanning…',
    complete: 'Scan complete',
    skip: 'Skip scan',
  },
  generatePost: {
    title: 'Generate a Post',
    subtitle: 'Create your first post',
    prompt: 'Enter prompt',
    generate: 'Generate',
    mockPost: 'Mock AI post content',
  },
  schedule: {
    title: 'Schedule',
    subtitle: 'Pick the best times',
    bestTimes: 'Best Times',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    timeSlots: ['09:00', '12:00', '18:00'],
  },
  done: {
    title: 'All Done!',
    subtitle: 'You are ready to go',
    goToDashboard: 'Go to Dashboard',
  },
  navigation: {
    back: 'Back',
    next: 'Next',
    create: 'Create',
  },
  progress: {
    stepOf: 'Step {current} of {total}',
  },
};

const DASHBOARD_URL = '/dashboard';

function renderWizard() {
  return render(<OnboardingWizard labels={LABELS} dashboardUrl={DASHBOARD_URL} />);
}

/* ─── Tests ─── */

describe('OnboardingWizard', () => {
  it('renders the first step (Welcome) initially', () => {
    renderWizard();

    expect(screen.getByText('Welcome to Purple Glow')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('progress indicator shows correct step count', () => {
    renderWizard();

    expect(screen.getByText('Step 1 of 7')).toBeInTheDocument();

    const progressDots = screen.getByTestId('progress-dots');
    const dots = progressDots.children;
    expect(dots).toHaveLength(7);
  });

  it('Next button advances to the next step', async () => {
    const user = userEvent.setup();
    renderWizard();

    // Advance from Welcome (step 0) → SelectTier (step 1) via "Get Started"
    await user.click(screen.getByText('Get Started'));

    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 7')).toBeInTheDocument();

    // Advance from SelectTier (step 1) → LinkAccount (step 2) via "Next"
    await user.click(screen.getByTestId('next-button'));

    expect(screen.getByText('Link Account')).toBeInTheDocument();
    expect(screen.getByText('Step 3 of 7')).toBeInTheDocument();
  });

  it('Back button goes to previous step', async () => {
    const user = userEvent.setup();
    renderWizard();

    // Go to step 1
    await user.click(screen.getByText('Get Started'));
    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();

    // Go to step 2
    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByText('Link Account')).toBeInTheDocument();

    // Go back to step 1
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 7')).toBeInTheDocument();
  });

  it('Skip button works on skippable steps', async () => {
    const user = userEvent.setup();
    renderWizard();

    // Go to step 1 (SelectTier) — skippable
    await user.click(screen.getByText('Get Started'));
    expect(screen.getByTestId('skip-button')).toBeInTheDocument();

    // Click Skip → advances to step 2
    await user.click(screen.getByTestId('skip-button'));
    expect(screen.getByText('Link Account')).toBeInTheDocument();
    expect(screen.getByText('Step 3 of 7')).toBeInTheDocument();
  });

  it('Welcome step is not skippable (no skip button)', () => {
    renderWizard();

    // On step 0 (Welcome) — no navigation bar at all (hidden for first & last step)
    expect(screen.queryByTestId('skip-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('step-navigation')).not.toBeInTheDocument();
  });

  it('Done step shows completion state', async () => {
    const user = userEvent.setup();
    renderWizard();

    // Navigate through all 7 steps: Welcome → SelectTier → Link → Brand → Generate → Schedule → Done
    await user.click(screen.getByText('Get Started'));             // 0 → 1
    await user.click(screen.getByTestId('next-button'));           // 1 → 2
    await user.click(screen.getByTestId('next-button'));           // 2 → 3
    await user.click(screen.getByTestId('next-button'));           // 3 → 4
    await user.click(screen.getByTestId('next-button'));           // 4 → 5
    await user.click(screen.getByTestId('next-button'));           // 5 → 6

    // Verify Done step content
    expect(screen.getByText('All Done!')).toBeInTheDocument();
    expect(screen.getByText('You are ready to go')).toBeInTheDocument();
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Step 7 of 7')).toBeInTheDocument();

    // No navigation bar on the Done step
    expect(screen.queryByTestId('step-navigation')).not.toBeInTheDocument();

    // Dashboard button triggers router.push
    await user.click(screen.getByText('Go to Dashboard'));
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });
});
