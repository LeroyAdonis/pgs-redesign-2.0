import { cn } from '@/lib/utils';

/**
 * Avatar — user profile image with fallback initials.
 *
 * Server component. Shows an image when `src` is provided,
 * otherwise renders fallback initials on a purple surface.
 */

/* ─── Types ─── */

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  /** Image URL */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Fallback text shown when no image (e.g. initials "JD") */
  fallback?: string;
  size?: AvatarSize;
  /** Online/offline status indicator */
  status?: 'online' | 'offline';
  className?: string;
}

/* ─── Style Maps ─── */

const sizeStyles: Record<AvatarSize, { container: string; text: string; status: string }> = {
  xs: { container: 'h-6 w-6',   text: 'text-[0.5rem]',    status: 'h-1.5 w-1.5 border' },
  sm: { container: 'h-8 w-8',   text: 'text-[0.625rem]',  status: 'h-2 w-2 border' },
  md: { container: 'h-10 w-10', text: 'text-xs',           status: 'h-2.5 w-2.5 border-2' },
  lg: { container: 'h-14 w-14', text: 'text-sm',           status: 'h-3 w-3 border-2' },
  xl: { container: 'h-20 w-20', text: 'text-base',         status: 'h-3.5 w-3.5 border-2' },
};

const statusColors: Record<'online' | 'offline', string> = {
  online: 'bg-success',
  offline: 'bg-text-muted',
};

/* ─── Component ─── */

function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  status,
  className,
}: AvatarProps) {
  const styles = sizeStyles[size];

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0',
        styles.container,
        className,
      )}
    >
      {/* Avatar circle */}
      <span
        className={cn(
          'flex items-center justify-center',
          'overflow-hidden rounded-full',
          'border-2 border-surface-raised',
          styles.container,
          // Fallback background when no image
          !src && 'bg-brand-surface text-brand',
        )}
      >
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className={cn(
              'font-medium uppercase leading-none select-none',
              styles.text,
            )}
            aria-label={alt || fallback}
          >
            {fallback ?? '?'}
          </span>
        )}
      </span>

      {/* Status indicator */}
      {status && (
        <span
          aria-label={status}
          className={cn(
            'absolute bottom-0 right-0',
            'rounded-full border-surface-raised',
            statusColors[status],
            styles.status,
          )}
        />
      )}
    </span>
  );
}

export { Avatar };
export type { AvatarProps, AvatarSize };
