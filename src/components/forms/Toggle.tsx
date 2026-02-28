'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

interface ToggleProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

/**
 * Toggle switch matching ds-toggle from the design system.
 * Track: 44×24, rounded-full. Thumb: 18px white circle.
 * Off = text-muted bg, On = brand bg with thumb shifted right.
 * Uses hidden native checkbox; visual driven by peer-checked.
 */
function Toggle({
  className,
  label,
  description,
  id: propId,
  ...props
}: ToggleProps) {
  const generatedId = useId();
  const id = propId ?? generatedId;

  return (
    <label
      htmlFor={id}
      className={cn(
        'group inline-flex items-center gap-3 cursor-pointer',
        props.disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className,
      )}
    >
      {/* Hidden native checkbox */}
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        {...props}
      />

      {/* Track — peer-checked slides the nested thumb right */}
      <span
        className={cn(
          'relative shrink-0 w-[44px] h-[24px] rounded-full',
          'bg-text-muted transition-colors duration-150',
          'peer-checked:bg-brand',
          // Move the nested thumb when checked (peer-checked only works on siblings,
          // so we use an arbitrary variant to target the child span)
          'peer-checked:[&>span]:left-[23px]',
          // Focus ring
          'peer-focus-visible:ring-3 peer-focus-visible:ring-brand-surface',
        )}
        aria-hidden="true"
      >
        {/* Thumb */}
        <span
          className={cn(
            'absolute top-[3px] left-[3px]',
            'h-[18px] w-[18px] rounded-full bg-white',
            'transition-[left] duration-150',
          )}
        />
      </span>

      {/* Label + description */}
      {(label || description) && (
        <span className="flex flex-col">
          {label && (
            <span className="text-sm text-text select-none">{label}</span>
          )}
          {description && (
            <span className="text-xs text-text-muted select-none mt-0.5">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}

export { Toggle };
export type { ToggleProps };
