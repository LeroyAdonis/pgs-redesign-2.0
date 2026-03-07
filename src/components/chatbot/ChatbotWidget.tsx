'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SupportForm } from './SupportForm';
import type { SupportFormData } from './SupportForm';

/* ─── Types ─── */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/* ─── Constants ─── */

const STORAGE_KEY_HISTORY = 'pgs-chatbot-history';
const STORAGE_KEY_SEEN = 'pgs-chatbot-seen';
const ONBOARDING_DELAY_MS = 2000;
const SUPPORT_ESCALATION_THRESHOLD = 3;

const WELCOME_MESSAGE =
  "Howzit! 👋 I'm your Purple Glow assistant. Ask me anything about managing your social media.";

const QUICK_ACTIONS = [
  'How do I get started?',
  'What can I post?',
  'How does billing work?',
] as const;

const SUPPORT_TRIGGERS = ['help', 'support', 'human', 'agent', 'person'];

/* ─── Icons ─── */

function ChatBubbleIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function CloseIcon() {
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
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

/* ─── Helpers ─── */

/** Generate a simple unique ID for messages */
function messageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Safely read from localStorage */
function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Safely write to localStorage */
function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable (private browsing, quota exceeded)
  }
}

/** Persist messages to localStorage */
function persistMessages(messages: Message[]): void {
  storageSet(STORAGE_KEY_HISTORY, JSON.stringify(messages));
}

/** Load messages from localStorage */
function loadMessages(): Message[] {
  const raw = storageGet(STORAGE_KEY_HISTORY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Rehydrate Date objects
    return parsed.map(
      (m: { id: string; role: 'user' | 'assistant'; content: string; timestamp: string }) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }),
    );
  } catch {
    return [];
  }
}

/** Check if text triggers support escalation */
function isSupportTrigger(text: string): boolean {
  const lower = text.toLowerCase();
  return SUPPORT_TRIGGERS.some((trigger) => lower.includes(trigger));
}

/** Count bot messages mentioning human help */
function countHumanSuggestions(messages: Message[]): number {
  return messages.filter(
    (m) =>
      m.role === 'assistant' &&
      (m.content.toLowerCase().includes('talk to a human') ||
        m.content.toLowerCase().includes('human agent')),
  ).length;
}

/* ─── Typing Indicator ─── */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-3 py-2" aria-label="Assistant is typing">
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center',
          'rounded-full bg-purple-600 text-white',
        )}
        aria-hidden="true"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
        </svg>
      </div>
      <div className="flex gap-1 rounded-2xl bg-surface-raised px-3.5 py-3 rounded-bl-md">
        <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

/* ─── Main Widget ─── */

/**
 * ChatbotWidget — floating chat bubble + expandable panel.
 *
 * Provides AI-powered chat via server-side /api/chat (Gemini),
 * onboarding flow for first-time users, quick-action buttons,
 * and support escalation with an inline form.
 *
 * Chat history is persisted to localStorage. The panel opens at z-[500]
 * above all other UI layers.
 */
function ChatbotWidget() {
  const t = useTranslations('chatbot');
  const panelId = useId();
  const pathname = usePathname();

  // ── State ──
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [initialised, setInitialised] = useState(false);
  // null = unknown (SSR / before useEffect), false = first-timer, true = returning user
  const [hasSeen, setHasSeen] = useState<boolean | null>(null);

  // ── Refs ──
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);

  // ── Scroll to bottom ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ── Initialise: load history & handle onboarding ──
  useEffect(() => {
    if (initialised) return;
    setInitialised(true);

    const stored = loadMessages();
    if (stored.length > 0) {
      setHasSeen(true);
      setMessages(stored);
      return;
    }

    // First-time user: auto-open with welcome after delay
    const seen = storageGet(STORAGE_KEY_SEEN);
    setHasSeen(seen !== null);

    const AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password'];
    const isAuthPage = AUTH_PATHS.some((p) => pathname.endsWith(p));

    if (!seen && !isAuthPage) {
      const timer = setTimeout(() => {
        const welcome: Message = {
          id: messageId(),
          role: 'assistant',
          content: WELCOME_MESSAGE,
          timestamp: new Date(),
        };
        setMessages([welcome]);
        setShowQuickActions(true);
        setIsOpen(true);
        persistMessages([welcome]);
      }, ONBOARDING_DELAY_MS);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount; `initialised` guard handles strict-mode double-fire
  }, []);

  // ── Auto-scroll when messages update ──
  useEffect(() => {
    if (isOpen) {
      // Small delay so the DOM has rendered
      const raf = requestAnimationFrame(() => scrollToBottom());
      return () => cancelAnimationFrame(raf);
    }
  }, [messages, isTyping, isOpen, scrollToBottom]);

  // ── ESC to close ──
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        bubbleRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // ── Focus trap ──
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const panel = panelRef.current;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function trapFocus(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    panel.addEventListener('keydown', trapFocus);
    // Focus first focusable element in the panel
    first.focus();
    return () => panel.removeEventListener('keydown', trapFocus);
  }, [isOpen, showSupportForm]);

  // ── Server-side AI chat via /api/chat ──
  const sendToAI = useCallback(
    async (userContent: string, history: Message[]): Promise<string> => {
      // Build conversation for the API
      const messages = [
        ...history.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user' as const, content: userContent },
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !data.reply) {
        // Use the server's error message if available, otherwise generic
        throw new Error(data.error ?? t('errors.aiUnavailable'));
      }

      return data.reply;
    },
    [t],
  );

  // ── Handle sending a message ──
  const handleSend = useCallback(
    async (content: string) => {
      const userMsg: Message = {
        id: messageId(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const updated = [...prev, userMsg];
        persistMessages(updated);
        return updated;
      });
      setShowQuickActions(false);
      setIsTyping(true);

      try {
        const aiContent = await sendToAI(content, messages);

        const botMsg: Message = {
          id: messageId(),
          role: 'assistant',
          content: aiContent,
          timestamp: new Date(),
        };

        setMessages((prev) => {
          const updated = [...prev, botMsg];
          persistMessages(updated);
          return updated;
        });
      } catch (err) {
        const errorText =
          err instanceof Error && err.message
            ? err.message
            : t('errors.aiUnavailable');

        const errorMsg: Message = {
          id: messageId(),
          role: 'assistant',
          content: errorText,
          timestamp: new Date(),
        };

        setMessages((prev) => {
          const updated = [...prev, errorMsg];
          persistMessages(updated);
          return updated;
        });
      } finally {
        setIsTyping(false);
      }
    },
    [messages, sendToAI, t],
  );

  // ── Toggle panel ──
  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        setHasUnread(false);
        // Mark as seen on first open
        storageSet(STORAGE_KEY_SEEN, 'true');
      }
      return !prev;
    });
  }, []);

  // ── Support form submission ──
  const handleSupportSubmit = useCallback(
    async (data: SupportFormData) => {
      const response = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? 'Failed to submit support ticket',
        );
      }
    },
    [],
  );

  // ── Determine if support button should show ──
  const shouldShowSupportButton =
    !showSupportForm &&
    (countHumanSuggestions(messages) >= SUPPORT_ESCALATION_THRESHOLD ||
      messages.some(
        (m) => m.role === 'user' && isSupportTrigger(m.content),
      ));

  return (
    <>
      {/* ── Floating Bubble ── */}
      <button
        ref={bubbleRef}
        type="button"
        onClick={toggleOpen}
        aria-label={isOpen ? t('close') : t('openChat')}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={cn(
          'fixed right-6 bottom-6 z-[500]',
          'flex h-14 w-14 items-center justify-center',
          'rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white',
          'shadow-lg shadow-purple-500/30',
          'transition-all duration-300',
          'hover:scale-105 hover:shadow-xl hover:shadow-purple-500/40',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
          'cursor-pointer',
          // Pulse animation on first appear (when not yet opened)
          !isOpen && hasSeen === false && 'animate-pulse',
        )}
      >
        {isOpen ? <CloseIcon /> : <ChatBubbleIcon />}

        {/* Unread indicator */}
        {hasUnread && !isOpen && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5',
              'h-3.5 w-3.5 rounded-full',
              'bg-error border-2 border-surface',
            )}
            aria-label={t('ariaLabels.newMessage')}
          />
        )}
      </button>

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={t('title')}
          aria-modal="true"
          className={cn(
            'fixed z-[500]',
            // Desktop: positioned above bubble
            'right-6 bottom-24',
            'w-[380px] max-h-[520px]',
            // Mobile: full width at bottom
            'max-[480px]:right-0 max-[480px]:bottom-0 max-[480px]:w-full max-[480px]:max-h-[85vh]',
            // Appearance
            'flex flex-col',
            'rounded-2xl overflow-hidden',
            'bg-surface border border-border',
            'shadow-2xl shadow-purple-900/20',
            // Entry animation
            'animate-[slideUp_200ms_ease-out]',
          )}
        >
          {/* ── Header ── */}
          <div
            className={cn(
              'flex items-center justify-between px-4 py-3',
              'bg-gradient-to-r from-purple-600 to-purple-700',
              'text-white',
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20"
                aria-hidden="true"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
                </svg>
              </div>
              <span className="text-sm font-semibold">{t('title')}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={t('close')}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full',
                'hover:bg-white/20 transition-colors duration-150',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                'cursor-pointer',
              )}
            >
              <CloseIcon />
            </button>
          </div>

          {/* ── Messages Area ── */}
          <div
            className="flex-1 overflow-y-auto py-3"
            role="list"
            aria-label={t('ariaLabels.messageList')}
          >
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
              />
            ))}

            {/* Typing indicator */}
            {isTyping && <TypingIndicator />}

            {/* Quick action buttons (onboarding) */}
            {showQuickActions && !isTyping && (
              <div className="flex flex-col gap-2 px-4 py-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => handleSend(action)}
                    className={cn(
                      'rounded-xl border border-purple-300 px-3 py-2',
                      'text-left text-xs font-medium text-purple-600',
                      'bg-purple-50 hover:bg-purple-100',
                      'transition-colors duration-150',
                      'cursor-pointer',
                      // Design system compatible colors
                      'border-brand-surface text-brand',
                    )}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            {/* Support escalation button */}
            {shouldShowSupportButton && (
              <div className="px-4 py-2">
                <button
                  type="button"
                  onClick={() => setShowSupportForm(true)}
                  className={cn(
                    'w-full rounded-xl px-4 py-2.5',
                    'text-sm font-medium text-white',
                    'bg-gradient-to-r from-purple-600 to-purple-500',
                    'hover:from-purple-700 hover:to-purple-600',
                    'transition-all duration-150',
                    'cursor-pointer',
                  )}
                >
                  💬 {t('support.talkToHuman')}
                </button>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          {/* ── Support Form (inline) ── */}
          {showSupportForm ? (
            <div className="border-t border-border">
              <SupportForm
                onSubmit={handleSupportSubmit}
                onCancel={() => setShowSupportForm(false)}
              />
            </div>
          ) : (
            /* ── Input Bar ── */
            <ChatInput onSend={handleSend} disabled={isTyping} />
          )}
        </div>
      )}

      {/* ── Slide-up keyframe (injected once) ── */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}

export { ChatbotWidget };
export type { Message };
