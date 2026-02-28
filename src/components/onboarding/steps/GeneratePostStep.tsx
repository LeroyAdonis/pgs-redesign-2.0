'use client';

/* ─── Types ─── */

interface GeneratePostStepProps {
  labels: {
    title: string;
    subtitle: string;
    prompt: string;
    generate: string;
    mockPost: string;
  };
}

/* ─── Component ─── */

export function GeneratePostStep({ labels }: GeneratePostStepProps) {
  return (
    <div className="py-4">
      <h2 className="text-center font-display text-2xl font-bold text-text">
        {labels.title}
      </h2>
      <p className="mt-2 text-center text-sm text-text-muted">
        {labels.subtitle}
      </p>

      {/* Mock content generation UI */}
      <div className="mt-6 space-y-4">
        {/* Prompt area */}
        <div className="rounded-lg border border-border bg-surface-inset p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            {labels.prompt}
          </p>
          <div className="mt-2 h-16 rounded-md border border-dashed border-border bg-surface" />
        </div>

        {/* Mock generate button */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-surface px-4 py-2 text-sm font-medium text-brand">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
              />
            </svg>
            {labels.generate}
          </span>
        </div>

        {/* Mock generated post */}
        <div className="rounded-lg border border-border bg-surface-raised p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-brand-surface" />
            <div>
              <div className="h-3 w-24 rounded bg-surface-inset" />
              <div className="mt-1 h-2 w-16 rounded bg-surface-inset" />
            </div>
          </div>
          <p className="mt-3 text-sm text-text-muted italic">
            {labels.mockPost}
          </p>
          <div className="mt-3 h-32 rounded-md bg-surface-inset" />
        </div>
      </div>
    </div>
  );
}
