import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessage } from '../ChatMessage';

// ── Mocks ──

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
  formatDateSAST: () => '10:30',
}));

// ── Tests ──

describe('ChatMessage', () => {
  // ── Role-based layout ──

  describe('user messages', () => {
    it('renders with right alignment (justify-end)', () => {
      render(<ChatMessage role="user" content="Hello there" />);

      const listItem = screen.getByRole('listitem');
      expect(listItem.className).toContain('justify-end');
    });

    it('does not render bot avatar', () => {
      const { container } = render(
        <ChatMessage role="user" content="User says hi" />,
      );

      // The sparkle SVG avatar is only rendered for assistant
      const svgs = container.querySelectorAll('svg');
      expect(svgs).toHaveLength(0);
    });

    it('applies purple bubble styles (bg-purple-600, text-white)', () => {
      render(<ChatMessage role="user" content="Styled message" />);

      const bubble = screen.getByText('Styled message').closest('div');
      expect(bubble?.className).toContain('bg-purple-600');
      expect(bubble?.className).toContain('text-white');
      expect(bubble?.className).toContain('rounded-br-md');
    });

    it('uses purple-200 timestamp colour', () => {
      render(
        <ChatMessage
          role="user"
          content="Timed"
          timestamp={new Date('2025-06-01T12:00:00Z')}
        />,
      );

      const timeEl = screen.getByRole('time');
      expect(timeEl.className).toContain('text-purple-200');
    });
  });

  describe('assistant messages', () => {
    it('renders with left alignment (justify-start)', () => {
      render(
        <ChatMessage role="assistant" content="Hi! How can I help?" />,
      );

      const listItem = screen.getByRole('listitem');
      expect(listItem.className).toContain('justify-start');
    });

    it('renders bot avatar with sparkle icon', () => {
      const { container } = render(
        <ChatMessage role="assistant" content="Bot reply" />,
      );

      // Avatar container: aria-hidden div with SVG inside
      const avatar = container.querySelector('[aria-hidden="true"]');
      expect(avatar).toBeTruthy();
      expect(avatar?.querySelector('svg')).toBeTruthy();
    });

    it('applies surface-raised bubble styles', () => {
      render(<ChatMessage role="assistant" content="Bot styled" />);

      const bubble = screen.getByText('Bot styled').closest('div');
      expect(bubble?.className).toContain('bg-surface-raised');
      expect(bubble?.className).toContain('text-text');
      expect(bubble?.className).toContain('rounded-bl-md');
    });

    it('uses text-muted timestamp colour', () => {
      render(
        <ChatMessage
          role="assistant"
          content="Timed"
          timestamp={new Date('2025-06-01T12:00:00Z')}
        />,
      );

      const timeEl = screen.getByRole('time');
      expect(timeEl.className).toContain('text-text-muted');
    });
  });

  // ── Content rendering ──

  describe('content', () => {
    it('displays message text', () => {
      render(<ChatMessage role="user" content="Test message content" />);

      expect(screen.getByText('Test message content')).toBeInTheDocument();
    });

    it('wraps content in a paragraph with whitespace-pre-wrap', () => {
      const { container } = render(
        <ChatMessage role="user" content={'Line one\nLine two'} />,
      );

      const paragraph = container.querySelector('p');
      expect(paragraph).toBeTruthy();
      expect(paragraph?.tagName).toBe('P');
      expect(paragraph?.className).toContain('whitespace-pre-wrap');
      expect(paragraph?.className).toContain('break-words');
      expect(paragraph?.textContent).toContain('Line one');
      expect(paragraph?.textContent).toContain('Line two');
    });

    it('renders empty string without crashing', () => {
      const { container } = render(
        <ChatMessage role="assistant" content="" />,
      );

      // Component renders, listitem present, paragraph exists but empty
      expect(screen.getByRole('listitem')).toBeInTheDocument();
      const paragraph = container.querySelector('p');
      expect(paragraph).toBeTruthy();
      expect(paragraph?.textContent).toBe('');
    });

    it('handles long messages gracefully', () => {
      const longText = 'A'.repeat(2000);
      render(<ChatMessage role="user" content={longText} />);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });

  // ── Timestamp ──

  describe('timestamp', () => {
    it('shows formatted time and ISO dateTime attribute', () => {
      const timestamp = new Date('2025-01-15T10:30:00Z');
      render(
        <ChatMessage
          role="assistant"
          content="Hello"
          timestamp={timestamp}
        />,
      );

      const timeEl = screen.getByRole('time');
      expect(timeEl).toBeInTheDocument();
      expect(timeEl).toHaveTextContent('10:30');
      expect(timeEl).toHaveAttribute(
        'datetime',
        timestamp.toISOString(),
      );
    });

    it('omits <time> element when timestamp is not provided', () => {
      render(<ChatMessage role="assistant" content="No time" />);

      expect(screen.queryByRole('time')).not.toBeInTheDocument();
    });
  });

  // ── Accessibility ──

  describe('accessibility', () => {
    it('has role="listitem" on the outer container', () => {
      render(<ChatMessage role="user" content="Accessible" />);

      expect(screen.getByRole('listitem')).toBeInTheDocument();
    });

    it('marks bot avatar as aria-hidden', () => {
      const { container } = render(
        <ChatMessage role="assistant" content="Bot" />,
      );

      const avatar = container.querySelector('[aria-hidden="true"]');
      expect(avatar).toBeTruthy();
    });

    it('marks sparkle SVG icon as aria-hidden', () => {
      const { container } = render(
        <ChatMessage role="assistant" content="Bot" />,
      );

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
