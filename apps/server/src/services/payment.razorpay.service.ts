import Razorpay from 'razorpay';
import crypto from 'crypto';
import { AppError } from '../utils/AppError';

let razorpay: Razorpay;

function getRazorpay(): Razorpay {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID ?? '',
      key_secret: process.env.RAZORPAY_KEY_SECRET ?? '',
    });
  }
  return razorpay;
}

export async function createRazorpayOrder(
  amount: number,
  currency = 'INR',
  receipt: string,
  notes: Record<string, string> = {}
): Promise<{
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}> {
  const rz = getRazorpay();

  const order = await rz.orders.create({
    amount: Math.round(amount * 100), // Convert to paise
    currency,
    receipt,
    notes,
  });

  return {
    id: order.id,
    amount: order.amount as number,
    currency: order.currency,
    receipt: order.receipt ?? receipt,
  };
}

export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET ?? '';
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === razorpaySignature;
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
}

export async function fetchRazorpayPayment(paymentId: string): Promise<{
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
}> {
  const rz = getRazorpay();
  const payment = await rz.payments.fetch(paymentId);

  return {
    id: payment.id,
    amount: payment.amount as number,
    currency: payment.currency,
    status: payment.status,
    method: payment.method ?? 'unknown',
  };
}

export async function initiateRefund(
  paymentId: string,
  amount: number,
  reason = 'Order cancelled'
): Promise<{ id: string; amount: number }> {
  const rz = getRazorpay();

  const refund = await rz.payments.refund(paymentId, {
    amount: Math.round(amount * 100),
    notes: { reason },
  });

  if (!refund || !refund.id) {
    throw new AppError('Failed to initiate refund', 500, 'REFUND_FAILED');
  }

  return {
    id: refund.id,
    amount: refund.amount as number,
  };
}
