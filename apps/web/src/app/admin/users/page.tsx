import type { Metadata } from 'next';
import { AdminUsersPage } from '@/components/admin/AdminUsersPage';

export const metadata: Metadata = { title: 'Manage Users' };

export default function AdminUsers() {
  return <AdminUsersPage />;
}
