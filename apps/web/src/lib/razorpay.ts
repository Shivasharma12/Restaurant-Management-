import crypto from 'crypto';

export function verifyRazorpayWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}
