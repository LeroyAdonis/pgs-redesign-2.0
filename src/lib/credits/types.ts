/**
 * Credit system types and constants
 *
 * Shared types for the credit deduction service, API routes,
 * and any future credit-related UI components.
 */

/** Org is "low balance" when remaining credits ≤ 10 % of monthly allocation */
export const LOW_BALANCE_THRESHOLD = 0.1;

export interface CreditBalance {
  balance: number;
  monthlyAllocation: number;
  rolloverBalance: number;
  rolloverExpiresAt: Date | null;
  /** Percentage of total available credits already consumed (0-100) */
  usagePercentage: number;
  /** True when remaining balance ≤ LOW_BALANCE_THRESHOLD × monthlyAllocation */
  isLowBalance: boolean;
}

export interface CreditDeductionResult {
  success: boolean;
  newBalance: number;
  error?: string;
}

export interface TransactionHistoryItem {
  id: string;
  type: string;
  amount: number;
  runningBalance: number;
  description: string | null;
  postId: string | null;
  createdAt: Date;
}
