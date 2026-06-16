import type { Metadata } from 'next';
import { AdminRestaurantsPage } from '@/components/admin/AdminRestaurantsPage';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = { title: 'Manage Restaurants' };

export default function AdminRestaurants() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        </div>
      }
    >
      <AdminRestaurantsPage />
    </Suspense>
  );
}
