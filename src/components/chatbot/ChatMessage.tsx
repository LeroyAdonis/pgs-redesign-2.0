'use client';

import { cn } from '@/lib/utils';
import { formatDateSAST } from '@/lib/utils';

/* ─── Types ─── */

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

/* ─── Icons ─── */

/** Small sparkle icon for the bot avatar */
function SparkleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  );
}

/* ─── Component ─── */

/**
 * ChatMessage — a single chat bubble.
 *
 * User messages are right-aligned with a purple background.
 * Bot messages are left-aligned with the surface-raised background
 * and a small purple avatar with a sparkle icon.
 *
 * Uses design system tokens (`bg-surface-raised`, `text-text`) so
 * dark mode works automatically via [data-theme="dark"] overrides.
 */
function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex gap-2 px-3 py-1',
        isUser ? 'justify-end' : 'justify-start',
      )}
      role="listitem"
    >
      {/* Bot avatar */}
      {!isUser && (
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center',
            'rounded-full bg-purple-600 text-white',
            'mt-0.5',
          )}
          aria-hidden="true"
        >
          <SparkleIcon />
        </div>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
          isUser
            ? 'bg-purple-600 text-white rounded-br-md'
            : 'bg-surface-raised text-text rounded-bl-md',
        )}
      >
        {/* Render content with line breaks preserved */}
        <p className="whitespace-pre-wrap break-words">{content}</p>

        {/* Timestamp */}
        {timestamp && (
          <time
            dateTime={timestamp.toISOString()}
            className={cn(
              'mt-1 block text-[10px] leading-none',
              isUser ? 'text-purple-200' : 'text-text-muted',
            )}
          >
            {formatDateSAST(timestamp, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        )}
      </div>
    </div>
  );
}

export { ChatMessage };
export type { ChatMessageProps };
