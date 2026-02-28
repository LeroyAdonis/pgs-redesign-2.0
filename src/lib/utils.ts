import { type ClassValue, clsx } from "clsx";

/**
 * Merge Tailwind CSS classes with conflict resolution.
 *
 * Uses clsx for conditional class joining. We intentionally avoid
 * tailwind-merge to keep the bundle small — our design system uses
 * non-conflicting utility patterns by convention.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Format a date for South African locale.
 * Uses SAST (UTC+2) as default timezone.
 */
export function formatDateSAST(
  date: Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    ...options,
  }).format(date);
}

/**
 * Format currency in ZAR (South African Rand).
 */
export function formatZAR(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount);
}

/**
 * Sleep utility for async operations.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
