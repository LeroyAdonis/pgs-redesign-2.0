'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/* ─── Types ─── */

interface SupportFormData {
  name: string;
  email: string;
  message: string;
}

interface SupportFormProps {
  onSubmit: (data: SupportFormData) => Promise<void>;
  onCancel: () => void;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

/* ─── Validation ─── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ─── Icons ─── */

function CheckCircleIcon() {
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
      className="text-success"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

/* ─── Component ─── */

/**
 * SupportForm — inline form for escalating to a human agent.
 *
 * Three fields: name, email (validated), message (textarea).
 * Fits within the chat panel layout.
 * Shows success confirmation or error message after submit.
 */
function SupportForm({ onSubmit, onCancel }: SupportFormProps) {
  const t = useTranslations('chatbot');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState(false);

  const canSubmit =
    status === 'idle' &&
    name.trim().length > 0 &&
    EMAIL_RE.test(email) &&
    message.trim().length > 0;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate email
      if (!EMAIL_RE.test(email)) {
        setEmailError(true);
        return;
      }
      setEmailError(false);

      setStatus('submitting');
      setErrorMessage('');

      try {
        await onSubmit({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        });
        setStatus('success');
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Something went wrong';
        setErrorMessage(msg);
        setStatus('error');
      }
    },
    [name, email, message, onSubmit],
  );

  // ── Success state ──
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
        <CheckCircleIcon />
        <p className="text-sm font-medium text-text">
          {t('support.success')}
        </p>
        <p className="text-xs text-text-muted">
          {t('support.successDetail')}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            'mt-2 rounded-none px-4 py-2 text-xs font-medium',
            'bg-brand-surface text-brand',
            'hover:bg-brand hover:text-white',
            'transition-colors duration-150',
          )}
        >
          {t('backToChat')}
        </button>
      </div>
    );
  }

  // ── Form ──
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 px-4 py-3"
      noValidate
    >
      <p className="text-xs font-medium text-text-secondary">
        {t('support.formTitle')}
      </p>

      {/* Name */}
      <div className="flex flex-col gap-1">
        <label htmlFor="support-name" className="text-xs text-text-muted">
          {t('support.name')}
        </label>
        <input
          id="support-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={status === 'submitting'}
          className={cn(
            'h-9 w-full rounded-none border border-border bg-surface-inset px-3 text-sm text-text',
            'placeholder:text-text-muted outline-none',
            'focus:border-brand',
            'disabled:opacity-50',
          )}
          placeholder={t('support.namePlaceholder')}
          required
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1">
        <label htmlFor="support-email" className="text-xs text-text-muted">
          {t('support.email')}
        </label>
        <input
          id="support-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(false);
          }}
          disabled={status === 'submitting'}
          className={cn(
            'h-9 w-full rounded-none border bg-surface-inset px-3 text-sm text-text',
            'placeholder:text-text-muted outline-none',
            'focus:border-brand',
            'disabled:opacity-50',
            emailError ? 'border-error' : 'border-border',
          )}
          placeholder={t('support.emailPlaceholder')}
          required
        />
        {emailError && (
          <p className="text-xs text-error">{t('support.emailInvalid')}</p>
        )}
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1">
        <label htmlFor="support-message" className="text-xs text-text-muted">
          {t('support.message')}
        </label>
        <textarea
          id="support-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={status === 'submitting'}
          rows={3}
          className={cn(
            'w-full resize-none rounded-none border border-border bg-surface-inset px-3 py-2 text-sm text-text',
            'placeholder:text-text-muted outline-none',
            'focus:border-brand',
            'disabled:opacity-50',
            'leading-relaxed',
          )}
          placeholder={t('support.messagePlaceholder')}
          required
        />
      </div>

      {/* Error message */}
      {status === 'error' && errorMessage && (
        <p className="rounded-none bg-error-surface px-3 py-2 text-xs text-error">
          {errorMessage}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!canSubmit && status !== 'error'}
          className={cn(
            'flex-1 rounded-none py-2 text-sm font-medium text-white',
            'bg-purple-600 hover:bg-purple-700',
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center justify-center gap-2',
          )}
        >
          {status === 'submitting' && (
            <span
              role="status"
              aria-label="Submitting"
              className={cn(
                'inline-block h-4 w-4 shrink-0',
                'rounded-full border-2 border-transparent border-t-current',
                'animate-spin',
              )}
            />
          )}
          {t('support.submit')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={status === 'submitting'}
          className={cn(
            'rounded-none px-4 py-2 text-sm text-text-muted',
            'hover:text-text hover:bg-surface-raised',
            'transition-colors duration-150',
            'disabled:opacity-50',
          )}
        >
          {t('support.cancel')}
        </button>
      </div>
    </form>
  );
}

export { SupportForm };
export type { SupportFormProps, SupportFormData };
