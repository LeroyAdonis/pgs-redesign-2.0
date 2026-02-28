'use client';

/* ─── Types ─── */

interface ScheduleStepProps {
  labels: {
    title: string;
    subtitle: string;
    bestTimes: string;
    days: string[];
    timeSlots: string[];
  };
}

/* ─── Component ─── */

export function ScheduleStep({ labels }: ScheduleStepProps) {
  return (
    <div className="py-4">
      <h2 className="text-center font-display text-2xl font-bold text-text">
        {labels.title}
      </h2>
      <p className="mt-2 text-center text-sm text-text-muted">
        {labels.subtitle}
      </p>

      {/* Mock calendar grid */}
      <div className="mt-6 rounded-lg border border-border bg-surface-raised p-4">
        {/* Days header */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {labels.days.map((day) => (
            <span key={day} className="text-[0.625rem] font-medium uppercase tracking-wider text-text-muted">
              {day}
            </span>
          ))}
        </div>

        {/* Calendar cells — decorative */}
        <div className="mt-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => {
            const dayNum = i - 2; // offset so month doesn't start on Monday
            const isValid = dayNum >= 1 && dayNum <= 28;
            const isHighlighted = [3, 5, 10, 12, 17, 19, 24, 26].includes(dayNum);
            return (
              <div
                key={i}
                className={
                  isValid
                    ? isHighlighted
                      ? 'flex h-8 items-center justify-center rounded-md bg-brand-surface text-xs font-medium text-brand'
                      : 'flex h-8 items-center justify-center rounded-md text-xs text-text-muted'
                    : 'h-8'
                }
              >
                {isValid ? dayNum : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Best times suggestion */}
      <div className="mt-4 rounded-lg border border-border bg-surface-raised p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
          {labels.bestTimes}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {labels.timeSlots.map((slot) => (
            <span
              key={slot}
              className="rounded-full border border-brand/20 bg-brand-surface px-3 py-1 text-xs font-medium text-brand"
            >
              {slot}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
