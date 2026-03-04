import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../ChatInput';

// ── Mocks ──

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

// ── Helpers ──

function renderChatInput(overrides?: { onSend?: (msg: string) => void; disabled?: boolean }) {
  const onSend = overrides?.onSend ?? vi.fn();
  const disabled = overrides?.disabled ?? false;
  const utils = render(<ChatInput onSend={onSend} disabled={disabled} />);
  return { onSend, ...utils };
}

// ── Tests ──

describe('ChatInput', () => {
  // ─── Rendering ───

  it('renders textarea with placeholder from translations', () => {
    renderChatInput();

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('placeholder', 'placeholder');
  });

  it('renders send button with aria-label', () => {
    renderChatInput();

    const button = screen.getByRole('button', { name: 'send' });
    expect(button).toBeInTheDocument();
  });

  // ─── Keyboard interaction ───

  it('calls onSend when Enter is pressed with text', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderChatInput({ onSend });

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello world{Enter}');

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith('Hello world');
  });

  it('does NOT call onSend on Shift+Enter (allows newline)', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderChatInput({ onSend });

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'line one{Shift>}{Enter}{/Shift}');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('does NOT call onSend when input is empty', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderChatInput({ onSend });

    const textarea = screen.getByRole('textbox');
    await user.click(textarea);
    await user.keyboard('{Enter}');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('does NOT call onSend when input is whitespace only', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderChatInput({ onSend });

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '   {Enter}');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('trims whitespace from message before sending', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderChatInput({ onSend });

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '  Hello  {Enter}');

    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  // ─── Send button ───

  it('send button is disabled when input is empty', () => {
    renderChatInput();

    const button = screen.getByRole('button', { name: 'send' });
    expect(button).toBeDisabled();
  });

  it('send button is enabled when input has text', async () => {
    const user = userEvent.setup();
    renderChatInput();

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello');

    const button = screen.getByRole('button', { name: 'send' });
    expect(button).toBeEnabled();
  });

  it('calls onSend when send button is clicked', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderChatInput({ onSend });

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Button click test');

    const button = screen.getByRole('button', { name: 'send' });
    await user.click(button);

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith('Button click test');
  });

  // ─── Clearing input ───

  it('clears input after sending via Enter', async () => {
    const user = userEvent.setup();
    renderChatInput();

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Message to send{Enter}');

    expect(textarea).toHaveValue('');
  });

  it('clears input after sending via button click', async () => {
    const user = userEvent.setup();
    renderChatInput();

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test message');

    const button = screen.getByRole('button', { name: 'send' });
    await user.click(button);

    expect(textarea).toHaveValue('');
  });

  // ─── Disabled / loading state ───

  it('disables textarea when disabled prop is true', () => {
    renderChatInput({ disabled: true });

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('disables send button when disabled prop is true', () => {
    renderChatInput({ disabled: true });

    // When disabled, aria-label switches to 'generating'
    const button = screen.getByRole('button', { name: 'generating' });
    expect(button).toBeDisabled();
  });

  it('shows spinner when disabled', () => {
    renderChatInput({ disabled: true });

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Generating response');
  });

  it('does not show spinner when not disabled', () => {
    renderChatInput({ disabled: false });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does NOT call onSend when disabled even if textarea has text', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    // Render enabled first so we can type
    const { rerender } = render(<ChatInput onSend={onSend} disabled={false} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello');

    // Re-render with disabled to simulate AI generating
    rerender(<ChatInput onSend={onSend} disabled={true} />);

    const button = screen.getByRole('button', { name: 'generating' });
    await user.click(button);

    expect(onSend).not.toHaveBeenCalled();
  });

  // ─── Accessibility ───

  it('textarea has aria-label matching placeholder', () => {
    renderChatInput();

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-label', 'placeholder');
  });

  it('send button aria-label reflects disabled state', () => {
    const { rerender } = render(<ChatInput onSend={vi.fn()} disabled={false} />);

    // When not disabled → 'send'
    expect(screen.getByRole('button', { name: 'send' })).toBeInTheDocument();

    // When disabled → 'generating'
    rerender(<ChatInput onSend={vi.fn()} disabled={true} />);
    expect(screen.getByRole('button', { name: 'generating' })).toBeInTheDocument();
  });

  it('send icon SVG is hidden from assistive technology', () => {
    renderChatInput();

    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
