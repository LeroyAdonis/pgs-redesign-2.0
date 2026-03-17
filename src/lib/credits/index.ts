export {
  getBalance,
  hasEnoughCredits,
  deductCredit,
  hasDeductionForPost,
  getTransactionHistory,
  addCredits,
} from "./credit-service";

export type {
  CreditBalance,
  CreditDeductionResult,
  TransactionHistoryItem,
} from "./types";

export { LOW_BALANCE_THRESHOLD } from "./types";
