'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Link2,
  Shield,
  Unlink,
  User
} from 'lucide-react';
import { apiDelete, apiGet, apiPut } from '@/lib/api';
import { showError, showSuccess } from '@/lib/notifications';

interface SocialAccount {
  id: string;
  provider: string;
  email: string;
  name: string;
  createdAt: string;
}

interface SocialAccountStatus {
  hasPassword: boolean;
  providerStatus: {
    google: boolean;
    naver: boolean;
    kakao: boolean;
  };
  connectedAccounts: SocialAccount[];
  canUnlink: boolean;
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'social' | 'security'>('profile');
  const [socialStatus, setSocialStatus] = useState<SocialAccountStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setProfileData({
      name: user.name,
      email: user.email
    });

    fetchSocialStatus();
  }, [user, router]);

  const fetchSocialStatus = async () => {
    try {
      const data = await apiGet('/api/social/status');
      if (data.success) {
        setSocialStatus(data.data);
      }
    } catch (error) {
      showError('소셜 계정 상태를 불러오는데 실패했습니다.');
    }
  };

  const handleSocialLogin = (provider: 'google' | 'naver' | 'kakao') => {
    window.location.href = `/api/social/${provider}`;
  };

  const handleUnlinkSocial = async (provider: string) => {
    if (!confirm(`${provider.toUpperCase()} 계정 연결을 해제하시겠습니까?`)) return;

    setIsLoading(true);
    
    try {
      const data = await apiDelete(`/api/social/unlink/${provider}`);
      
      if (data.success) {
        showSuccess(data.message);
        fetchSocialStatus();
      } else {
        showError(data.error);
      }
    } catch (error) {
      showError('소셜 계정 연결 해제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await apiPut('/api/auth/profile', profileData);
      
      if (data.success) {
        showSuccess('프로필이 성공적으로 업데이트되었습니다.');
        // 로컬 상태 업데이트 필요 시 여기서 처리
      } else {
        showError(data.error);
      }
    } catch (error) {
      showError('프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    
    setIsLoading(true);

    try {
      const data = await apiPut('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (data.success) {
        showSuccess('비밀번호가 성공적으로 변경되었습니다.');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showError(data.error);
      }
    } catch (error) {
      showError('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSocialIcon = (provider: string) => {
    const baseUrl = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';
    const icons = {
      google: `${baseUrl}/google/google-original.svg`,
      naver: 'https://developers.naver.com/inc/devcenter/images/nd_img.png',
      kakao: 'https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png'
    };
    return icons[provider as keyof typeof icons];
  };

  const getSocialButtonStyle = (provider: string) => {
    const styles = {
      google: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300',
      naver: 'bg-[#03C75A] hover:bg-[#02B350] text-white',
      kakao: 'bg-[#FEE500] hover:bg-[#FDD835] text-gray-900'
    };
    return styles[provider as keyof typeof styles];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⚙️ 계정 설정
          </h1>
          <p className="text-gray-600">
            프로필 정보와 보안 설정을 관리하세요
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'profile' ? 'default' : 'outline'}
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            프로필
          </Button>
          <Button
            variant={activeTab === 'social' ? 'default' : 'outline'}
            onClick={() => setActiveTab('social')}
            className="flex items-center gap-2"
          >
            <Link2 className="h-4 w-4" />
            소셜 계정
          </Button>
          <Button
            variant={activeTab === 'security' ? 'default' : 'outline'}
            onClick={() => setActiveTab('security')}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            보안
          </Button>
        </div>

        {/* 프로필 탭 */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                프로필 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    placeholder="이름을 입력하세요"
                  />
                </div>

                <div>
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    placeholder="이메일을 입력하세요"
                  />
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? '저장 중...' : '프로필 저장'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 소셜 계정 탭 */}
        {activeTab === 'social' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                소셜 계정 연결
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  소셜 계정을 연결하면 더 편리하게 로그인할 수 있습니다.
                </p>

                {socialStatus && (
                  <div className="space-y-4">
                    {/* Google */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <img 
                          src={getSocialIcon('google')} 
                          alt="Google" 
                          className="w-8 h-8"
                        />
                        <div>
                          <p className="font-medium">Google</p>
                          <p className="text-sm text-gray-500">
                            {socialStatus.providerStatus.google ? '연결됨' : '연결 안됨'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {socialStatus.providerStatus.google ? (
                          <>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              연결됨
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnlinkSocial('google')}
                              disabled={!socialStatus.canUnlink || isLoading}
                            >
                              <Unlink className="h-4 w-4 mr-1" />
                              연결 해제
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className={getSocialButtonStyle('google')}
                            onClick={() => handleSocialLogin('google')}
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            연결
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Naver */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <img 
                          src={getSocialIcon('naver')} 
                          alt="Naver" 
                          className="w-8 h-8"
                        />
                        <div>
                          <p className="font-medium">네이버</p>
                          <p className="text-sm text-gray-500">
                            {socialStatus.providerStatus.naver ? '연결됨' : '연결 안됨'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {socialStatus.providerStatus.naver ? (
                          <>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              연결됨
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnlinkSocial('naver')}
                              disabled={!socialStatus.canUnlink || isLoading}
                            >
                              <Unlink className="h-4 w-4 mr-1" />
                              연결 해제
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className={getSocialButtonStyle('naver')}
                            onClick={() => handleSocialLogin('naver')}
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            연결
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Kakao */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <img 
                          src={getSocialIcon('kakao')} 
                          alt="Kakao" 
                          className="w-8 h-8"
                        />
                        <div>
                          <p className="font-medium">카카오</p>
                          <p className="text-sm text-gray-500">
                            {socialStatus.providerStatus.kakao ? '연결됨' : '연결 안됨'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {socialStatus.providerStatus.kakao ? (
                          <>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              연결됨
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnlinkSocial('kakao')}
                              disabled={!socialStatus.canUnlink || isLoading}
                            >
                              <Unlink className="h-4 w-4 mr-1" />
                              연결 해제
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className={getSocialButtonStyle('kakao')}
                            onClick={() => handleSocialLogin('kakao')}
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            연결
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {socialStatus && !socialStatus.canUnlink && (
                  <div className="flex items-center p-4 border rounded-lg bg-yellow-50 text-yellow-800">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <p className="text-sm">
                      마지막 로그인 방법입니다. 비밀번호를 설정하거나 다른 소셜 계정을 연결한 후 해제할 수 있습니다.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 보안 탭 */}
        {activeTab === 'security' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                비밀번호 변경
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">현재 비밀번호</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      placeholder="현재 비밀번호를 입력하세요"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                      className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">새 비밀번호</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      placeholder="새 비밀번호를 입력하세요"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                      className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      placeholder="새 비밀번호를 다시 입력하세요"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                      className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? '변경 중...' : '비밀번호 변경'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 