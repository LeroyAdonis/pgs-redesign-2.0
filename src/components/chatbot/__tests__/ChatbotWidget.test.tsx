import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatbotWidget } from '../ChatbotWidget';

// ── Mocks ──

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
  formatDateSAST: () => '10:30',
}));

// ── localStorage stub ──

let storage: Record<string, string> = {};

beforeEach(() => {
  storage = {};
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      storage = {};
    }),
  });

  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ── Tests ──

describe('ChatbotWidget', () => {
  it('renders floating bubble button', () => {
    render(<ChatbotWidget />);

    // The bubble button has aria-label from t('openChat')
    const bubble = screen.getByRole('button', { name: 'openChat' });
    expect(bubble).toBeInTheDocument();
  });

  it('opens panel when bubble is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChatbotWidget />);

    const bubble = screen.getByRole('button', { name: 'openChat' });
    await user.click(bubble);

    // Panel should appear as a dialog
    const panel = screen.getByRole('dialog');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute('aria-label', 'title');
  });

  it('closes panel when close button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChatbotWidget />);

    // Open the panel
    const bubble = screen.getByRole('button', { name: 'openChat' });
    await user.click(bubble);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Click the close button inside the panel header (not the floating bubble,
    // which also has aria-label "close" when the panel is open)
    const closeButton = within(dialog).getByRole('button', { name: 'close' });
    await user.click(closeButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes panel on ESC key', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChatbotWidget />);

    // Open the panel
    const bubble = screen.getByRole('button', { name: 'openChat' });
    await user.click(bubble);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Escape
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows welcome message on first visit (localStorage empty)', async () => {
    render(<ChatbotWidget />);

    // Advance past the ONBOARDING_DELAY_MS (2000ms)
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    // The panel should auto-open with the welcome message
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Howzit!.*I'm your Purple Glow assistant/),
    ).toBeInTheDocument();
  });

  it('shows quick action buttons after welcome message', async () => {
    render(<ChatbotWidget />);

    // Advance past onboarding delay
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Quick actions should be visible
    expect(screen.getByText('How do I get started?')).toBeInTheDocument();
    expect(screen.getByText('What can I post?')).toBeInTheDocument();
    expect(screen.getByText('How does billing work?')).toBeInTheDocument();
  });

  it('persists messages to localStorage', async () => {
    render(<ChatbotWidget />);

    // Trigger the welcome message
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // localStorage.setItem should have been called with the history key
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'pgs-chatbot-history',
      expect.any(String),
    );

    // Parse the stored value to check it contains the welcome message
    const calls = vi.mocked(localStorage.setItem).mock.calls;
    const historyCall = calls.find(
      ([key]) => key === 'pgs-chatbot-history',
    );
    expect(historyCall).toBeTruthy();

    const stored = JSON.parse(historyCall![1]) as Array<{
      role: string;
      content: string;
    }>;
    expect(stored).toHaveLength(1);
    expect(stored[0].role).toBe('assistant');
    expect(stored[0].content).toContain('Howzit!');
  });

  it('does not auto-open for returning users (seen flag set)', async () => {
    // Simulate a returning user who has seen the chatbot
    storage['pgs-chatbot-seen'] = 'true';

    render(<ChatbotWidget />);

    // Advance past onboarding delay
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Panel should NOT auto-open
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('loads existing messages from localStorage', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    // Pre-populate localStorage with message history
    const existingMessages = [
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'Welcome back!',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        role: 'user',
        content: 'Hi there',
        timestamp: new Date().toISOString(),
      },
    ];
    storage['pgs-chatbot-history'] = JSON.stringify(existingMessages);
    storage['pgs-chatbot-seen'] = 'true';

    render(<ChatbotWidget />);

    // Open the panel manually
    const bubble = screen.getByRole('button', { name: 'openChat' });
    await user.click(bubble);

    // Should show the persisted messages
    expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });
});
