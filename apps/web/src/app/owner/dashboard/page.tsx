import { OwnerDashboard } from '@/components/owner/OwnerDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Owner Dashboard',
};

export default function OwnerDashboardPage() {
  return <OwnerDashboard />;
}
