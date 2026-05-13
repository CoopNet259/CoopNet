'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Dashboard sayfalarında çağrılır.
 * localStorage'da oturum yoksa login'e yönlendirir.
 */
export function useAuth() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('coopnet_auth');
      if (!auth) {
        router.replace('/login');
      }
    }
  }, [router]);
}

/**
 * Logout helper — token siler, login'e yönlendirir.
 */
export function logout(router: ReturnType<typeof useRouter>) {
  localStorage.removeItem('coopnet_auth');
  router.replace('/login');
}
