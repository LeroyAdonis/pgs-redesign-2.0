'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

/**
 * Checkbox matching ds-checkbox from the design system.
 * 20×20 box, border-2 when unchecked, bg-brand with white checkmark when checked.
 * Uses a hidden native checkbox for accessibility; visual driven by peer state.
 */
function Checkbox({ className, label, id: propId, ...props }: CheckboxProps) {
  const generatedId = useId();
  const id = propId ?? generatedId;

  return (
    <label
      htmlFor={id}
      className={cn(
        'group inline-flex items-center gap-2 cursor-pointer min-h-[44px]',
        props.disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {/* Hidden native checkbox — drives :checked state via peer */}
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        {...props}
      />

      {/* Visual box */}
      <span
        className={cn(
          'flex shrink-0 items-center justify-center',
          'h-5 w-5 rounded-[4px]',
          'border-2 border-text-muted',
          'transition-all duration-150',
          // Checked state — peer-checked turns on bg + checkmark
          'peer-checked:bg-brand peer-checked:border-brand',
          // Show the nested SVG when checked (peer-checked only works on siblings,
          // so we use an arbitrary variant to target the child SVG)
          'peer-checked:[&>svg]:opacity-100',
          // Focus ring on the visual box when checkbox is focused
          'peer-focus-visible:ring-3 peer-focus-visible:ring-brand-surface',
        )}
        aria-hidden="true"
      >
        {/* Checkmark SVG — hidden by default, shown via parent peer-checked */}
        <svg
          className="h-3.5 w-3.5 text-white opacity-0 transition-opacity duration-150"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path
            d="M11.5 3.5L5.5 10L2.5 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {label && (
        <span className="text-sm text-text select-none">{label}</span>
      )}
    </label>
  );
}

export { Checkbox };
export type { CheckboxProps };
