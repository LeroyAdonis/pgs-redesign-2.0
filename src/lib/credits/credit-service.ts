/**
 * Credit service — deduction and balance checks
 *
 * Manages credit transactions for post publishing. Each published post
 * costs 1 credit by default. The service validates balance before
 * deducting and creates an audit-trail transaction record.
 *
 * NOTE: This is a stub file providing the interface contract.
 * Real implementation will be merged from the credits worktree (Stream B).
 */

/** Result of a credit deduction attempt. */
export interface CreditDeductionResult {
  success: boolean;
  newBalance: number;
  error?: string;
}

/**
 * Deduct credits from an organization's balance.
 *
 * @param orgId  - Organization to deduct from
 * @param postId - Post consuming the credit (for audit trail)
 * @param amount - Number of credits to deduct (default: 1)
 * @returns Deduction result with new balance
 * @throws until real service is merged from Stream B
 */
export async function deductCredit(
  orgId: string,
  postId: string,
  amount: number = 1,
): Promise<CreditDeductionResult> {
  void orgId;
  void postId;
  void amount;
  throw new Error(
    "Credit service not yet implemented — will be available after merge",
  );
}

/**
 * Check whether an organization has enough credits for a publish action.
 *
 * @param orgId  - Organization to check
 * @param amount - Number of credits needed (default: 1)
 * @returns true if balance is sufficient
 * @throws until real service is merged from Stream B
 */
export async function hasEnoughCredits(
  orgId: string,
  amount: number = 1,
): Promise<boolean> {
  void orgId;
  void amount;
  throw new Error(
    "Credit service not yet implemented — will be available after merge",
  );
}
