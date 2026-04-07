import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

/* ─── Mocks ─── */

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/onboarding',
}));

const mockFetch = vi.fn();

/* ─── Fixture — labels matching OnboardingWizardProps ─── */

const LABELS = {
  welcome: {
    title: 'Welcome to Purple Glow',
    subtitle: "Let's set you up",
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
  linkAccounts: {
    title: 'Connect Your Accounts',
    subtitle: 'Link your social media platforms',
    connect: 'Connect',
    connected: 'Connected',
    skip: 'Skip for now',
  },
  brandScan: {
    title: 'Brand Scan',
    subtitle: 'Analyzing your brand',
    scanning: 'Scanning…',
    complete: 'Scan complete',
    skip: 'Skip scan',
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

/* ─── Setup ─── */

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  });
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ─── Tests ─── */

describe('OnboardingWizard', () => {
  it('renders the first step with welcome title', () => {
    renderWizard();

    expect(screen.getByText('Welcome to Purple Glow')).toBeInTheDocument();
  });

  it('progress indicator shows Step 1 of 5 on first step', () => {
    renderWizard();

    // The component has TOTAL_STEPS = 5
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  it('step 0 button text is "Next" from labels.navigation.next', () => {
    renderWizard();

    // Step 0 uses labels.navigation.next for its button
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('Next button on step 0 is disabled when org name is empty', () => {
    renderWizard();

    const nextBtn = screen.getByRole('button', { name: 'Next' });
    expect(nextBtn).toBeDisabled();
    // Still on step 0
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  it('advances to step 1 (Select Tier) after entering org name', async () => {
    const user = userEvent.setup();
    renderWizard();

    // Enter org name
    await user.type(screen.getByPlaceholderText('Enter organization name'), 'My Brand');
    // Click Next
    await user.click(screen.getByRole('button', { name: 'Next' }));

    // Step 1: Select Tier
    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
  });

  it('Back button returns to previous step', async () => {
    const user = userEvent.setup();
    renderWizard();

    // Go to step 1
    await user.type(screen.getByPlaceholderText('Enter organization name'), 'My Brand');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();

    // Go back
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('Welcome to Purple Glow')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  it('Done step shows completion and dashboard button triggers navigation', async () => {
    const user = userEvent.setup();
    renderWizard();

    // Step 0 → 1: Enter name, click Next
    await user.type(screen.getByPlaceholderText('Enter organization name'), 'My Brand');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    // Step 1 → 2: Click Create (calls fetch /api/onboarding/setup)
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByText('Connect Your Accounts')).toBeInTheDocument();
    });

    // Step 2 → 3: Skip
    await user.click(screen.getByRole('button', { name: 'Skip for now' }));
    expect(screen.getByText('Brand Scan')).toBeInTheDocument();

    // Step 3: Brand scan auto-starts and completes via mocked fetch
    await waitFor(() => {
      expect(screen.getByText(LABELS.brandScan.complete)).toBeInTheDocument();
    });
    // Once scan is complete, button shows labels.navigation.next
    await user.click(screen.getByRole('button', { name: 'Next' }));

    // Step 4: Done
    expect(screen.getByText('All Done!')).toBeInTheDocument();
    expect(screen.getByText('You are ready to go')).toBeInTheDocument();
    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();

    // Click Go to Dashboard
    await user.click(screen.getByRole('button', { name: 'Go to Dashboard' }));
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });
});
