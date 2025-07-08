'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setToken } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      console.error('🚨 소셜 로그인 오류:', error);
      setTimeout(() => {
        router.push('/auth/login?error=' + encodeURIComponent(error));
      }, 2000);
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        
        // 상태 저장
        setToken(token);
        setUser(user);
        
        console.log('✅ 소셜 로그인 성공:', user.email);
        
        // 메인 페이지로 리다이렉트
        setTimeout(() => {
          router.push('/');
        }, 2000);
        
      } catch (error) {
        console.error('🚨 사용자 정보 파싱 오류:', error);
        setTimeout(() => {
          router.push('/auth/login?error=' + encodeURIComponent('로그인 정보 처리 중 오류가 발생했습니다'));
        }, 2000);
      }
    } else {
      console.error('🚨 토큰 또는 사용자 정보 없음');
      setTimeout(() => {
        router.push('/auth/login?error=' + encodeURIComponent('로그인 정보가 없습니다'));
      }, 2000);
    }
  }, [searchParams, router, setUser, setToken]);

  const error = searchParams.get('error');
  const token = searchParams.get('token');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {error ? '로그인 실패' : '로그인 처리 중...'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {error ? (
            <div className="space-y-4">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <div>
                <p className="text-red-600 mb-2">로그인에 실패했습니다</p>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
              <p className="text-sm text-gray-500">잠시 후 로그인 페이지로 이동합니다...</p>
            </div>
          ) : token ? (
            <div className="space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <p className="text-green-600 mb-2">로그인 성공!</p>
                <p className="text-sm text-gray-600">환영합니다</p>
              </div>
              <p className="text-sm text-gray-500">잠시 후 메인 페이지로 이동합니다...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Loader2 className="h-16 w-16 text-blue-500 mx-auto animate-spin" />
              <div>
                <p className="text-blue-600 mb-2">로그인 처리 중...</p>
                <p className="text-sm text-gray-600">잠시만 기다려주세요</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 