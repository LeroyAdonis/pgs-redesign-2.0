'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/* ─── Types ─── */

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

/* ─── Icons ─── */

/** Arrow-up send icon */
function SendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}

/** Small loading spinner */
function SpinnerIcon() {
  return (
    <span
      role="status"
      aria-label="Generating response"
      className={cn(
        'inline-block h-[18px] w-[18px] shrink-0',
        'rounded-full border-2 border-transparent border-t-current',
        'animate-spin',
      )}
    />
  );
}

/* ─── Component ─── */

/**
 * ChatInput — message composer with send button.
 *
 * Supports Enter to send (Shift+Enter for newline).
 * Shows a spinner in the send button when `disabled` (AI generating).
 * Uses `useTranslations('chatbot')` for the placeholder string.
 */
function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const t = useTranslations('chatbot');
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Auto-resize the textarea to fit content, max 5 rows */
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    // Cap at ~5 lines (5 × 20px line height)
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    // Reset textarea height after clearing
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="flex items-end gap-2 border-t border-border bg-surface p-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          autoResize();
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={t('placeholder')}
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-xl px-3.5 py-2',
          'bg-surface-inset border border-border text-sm text-text',
          'placeholder:text-text-muted',
          'outline-none transition-[border-color] duration-150',
          'focus:border-brand',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'leading-5',
        )}
        aria-label={t('placeholder')}
      />

      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center',
          'rounded-full bg-purple-600 text-white',
          'transition-all duration-150',
          'hover:bg-purple-700 active:bg-purple-800',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        )}
        aria-label={disabled ? t('generating') : t('send')}
      >
        {disabled ? <SpinnerIcon /> : <SendIcon />}
      </button>
    </div>
  );
}

export { ChatInput };
export type { ChatInputProps };
