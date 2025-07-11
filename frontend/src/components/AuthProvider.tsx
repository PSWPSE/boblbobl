'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // 클라이언트에서만 Auth 초기화
    initialize();
  }, [initialize]);

  return <>{children}</>;
} 