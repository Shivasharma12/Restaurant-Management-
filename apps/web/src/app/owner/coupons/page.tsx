import type { Metadata } from 'next';
import { OwnerCouponsPage } from '@/components/owner/OwnerCouponsPage';

export const metadata: Metadata = { title: 'Coupon Management' };

export default function OwnerCoupons() {
  return <OwnerCouponsPage />;
}
