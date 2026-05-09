import crypto from 'crypto';
import { config } from '../config/env';
import { logger } from '../common/utils/logger';

interface PaymentInput {
  cardholderName: string;
  cardNumberLast4: string;
  simulateFailure?: boolean;
}

interface PaymentResult {
  success: boolean;
  transactionId: string;
  failureReason?: string;
}

/**
 * Simulates a payment — no external service called.
 * Phase 2: replace this body with stripe.paymentIntents.create() + confirm().
 */
export function simulatePayment(input: PaymentInput): PaymentResult {
  logger.info('simulatePayment called', {
    cardholderName: input.cardholderName,
    cardNumberLast4: input.cardNumberLast4,
  });

  if (config.SIMULATE_PAYMENT_FAILURE || input.simulateFailure) {
    return {
      success: false,
      transactionId: `FAIL-${crypto.randomUUID()}`,
      failureReason: 'Payment declined. Please check your card details.',
    };
  }

  return {
    success: true,
    transactionId: `TXN-${crypto.randomUUID()}`,
  };
}
