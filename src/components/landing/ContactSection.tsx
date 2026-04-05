'use client';

import { useTranslations } from 'next-intl';
import { type FormEvent, useCallback } from 'react';

/**
 * Contact form section — "Make Contact" with name, email, message.
 *
 * Client component: handles form submission.
 * Matches the contact section from index-v2.html.
 */
export function ContactSection() {
  const t = useTranslations('landing.contact');

  const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Form handling to be implemented with server action
  }, []);

  return (
    <section id="contact" className="py-[100px] lg:py-[140px] border-t border-border">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="font-display text-[clamp(36px,4.5vw,56px)] font-normal">
            {t('titlePrefix')}{' '}
            <span className="text-brand">{t('titleHighlight')}</span>
          </h2>
        </div>

        {/* Form */}
        <form className="max-w-[640px] mx-auto" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
            <input
              type="text"
              name="name"
              placeholder={t('name')}
              className="w-full px-[18px] py-4 bg-surface-inset border border-border rounded text-text-inverse font-body text-[13px] font-normal placeholder:text-text-muted placeholder:text-[10px] placeholder:tracking-[2.5px] placeholder:uppercase focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all duration-300"
            />
            <input
              type="email"
              name="email"
              placeholder={t('email')}
              className="w-full px-[18px] py-4 bg-surface-inset border border-border rounded text-text-inverse font-body text-[13px] font-normal placeholder:text-text-muted placeholder:text-[10px] placeholder:tracking-[2.5px] placeholder:uppercase focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all duration-300"
            />
          </div>
          <textarea
            name="message"
            placeholder={t('message')}
            className="w-full px-[18px] py-4 bg-surface-inset border border-border rounded text-text-inverse font-body text-[13px] font-normal placeholder:text-text-muted placeholder:text-[10px] placeholder:tracking-[2.5px] placeholder:uppercase focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all duration-300 resize-y min-h-[130px] mb-3.5"
          />
          <button
            type="submit"
            className="w-full mt-1.5 inline-flex items-center justify-center gap-2.5 px-8 py-4 text-xs font-semibold tracking-[1.5px] uppercase bg-brand text-white rounded-[3px] hover:bg-brand-hover hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(139,92,246,0.35)] transition-all duration-400"
          >
            {t('sendMessage')}
          </button>
        </form>
      </div>
    </section>
  );
}
