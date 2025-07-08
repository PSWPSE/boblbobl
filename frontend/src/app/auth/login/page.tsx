'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/lib/auth';
import { Eye, EyeOff, Mail, Lock, Brain, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      router.push('/');
    }

    // URL 파라미터에서 오류 메시지 확인
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [user, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        login(data.token, data.user);
        router.push('/');
      } else {
        setError(data.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'naver' | 'kakao') => {
    window.location.href = `/api/social/${provider}`;
  };

  const getSocialButtonStyle = (provider: 'google' | 'naver' | 'kakao') => {
    const styles = {
      google: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300',
      naver: 'bg-[#03C75A] hover:bg-[#02B350] text-white',
      kakao: 'bg-[#FEE500] hover:bg-[#FDD835] text-gray-900'
    };
    return styles[provider];
  };

  const getSocialIcon = (provider: 'google' | 'naver' | 'kakao') => {
    const baseUrl = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';
    const icons = {
      google: `${baseUrl}/google/google-original.svg`,
      naver: 'https://developers.naver.com/inc/devcenter/images/nd_img.png',
      kakao: 'https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png'
    };
    return icons[provider];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 text-white p-3 rounded-full">
              <Brain className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">BlogCraft에 로그인</CardTitle>
          <CardDescription>
            계정에 로그인하여 AI 블로그 콘텐츠를 생성하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="이메일을 입력하세요"
                  className="pl-10"
                  required
                />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="비밀번호를 입력하세요"
                  className="pl-10 pr-10"
                  required
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는 소셜 로그인</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className={`w-full ${getSocialButtonStyle('google')}`}
              onClick={() => handleSocialLogin('google')}
            >
              <img 
                src={getSocialIcon('google')} 
                alt="Google" 
                className="w-5 h-5 mr-2"
              />
              Google로 로그인
            </Button>

            <Button
              type="button"
              variant="outline"
              className={`w-full ${getSocialButtonStyle('naver')}`}
              onClick={() => handleSocialLogin('naver')}
            >
              <img 
                src={getSocialIcon('naver')} 
                alt="Naver" 
                className="w-5 h-5 mr-2"
              />
              네이버로 로그인
            </Button>

            <Button
              type="button"
              variant="outline"
              className={`w-full ${getSocialButtonStyle('kakao')}`}
              onClick={() => handleSocialLogin('kakao')}
            >
              <img 
                src={getSocialIcon('kakao')} 
                alt="Kakao" 
                className="w-5 h-5 mr-2"
              />
              카카오로 로그인
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              계정이 없으신가요?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:text-blue-500">
                회원가입
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 