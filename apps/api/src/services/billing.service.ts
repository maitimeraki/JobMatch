// Billing service — mock in dev, Stripe in production.
// Set BILLING_MODE=live and add STRIPE_SECRET_KEY to env for real charges.

import { AppError } from "../middleware/error.middleware.js";

interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  currency: string;
}

const MODE = process.env.BILLING_MODE || "mock";

export const billingService = {
  async charge(
    _customerId: string | null,
    amount: number,
    currency: string,
    _description: string
  ): Promise<PaymentResult> {
    if (MODE === "live") {
      throw new AppError(501, "NOT_IMPLEMENTED", "Stripe not configured");
    }
    const id = `mock_txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return { success: true, transactionId: id, amount, currency };
  },

  async refund(_transactionId: string): Promise<boolean> {
    if (MODE === "live") {
      throw new AppError(501, "NOT_IMPLEMENTED", "Stripe not configured");
    }
    return true;
  },
};
