'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (mounted) {
      if (!isAuthenticated || !user) {
        router.push('/login');
      } else if (user.role !== 'SUPER_ADMIN') {
        router.push('/');
      }
    }
  }, [mounted, user, isAuthenticated, router]);

  if (!mounted || !user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
