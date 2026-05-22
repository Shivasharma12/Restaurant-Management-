import { AdminDashboard } from '@/components/admin/AdminDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Super Admin Dashboard' };

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
