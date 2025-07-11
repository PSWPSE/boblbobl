import { create } from 'zustand';

// 사용자 타입 정의
interface User {
  id: string;
  email: string;
  name: string;
  provider: string;
  subscription: string;
}

// Auth Store 타입 정의
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => void;
  initialize: () => void;
}

// Zustand Auth Store
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  isInitialized: false,

  login: (token: string, user: User) => {
    tokenStorage.set(token);
    userStorage.set(user);
    set({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true
    });
  },

  logout: () => {
    tokenStorage.remove();
    userStorage.remove();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true
    });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  checkAuth: () => {
    if (typeof window === 'undefined') {
      set({ isInitialized: true, isLoading: false });
      return;
    }
    
    try {
      const token = tokenStorage.get();
      const user = userStorage.get();
      
      if (token && user && isTokenValid(token)) {
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true
        });
      } else {
        // 토큰이 없거나 유효하지 않은 경우
        tokenStorage.remove();
        userStorage.remove();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true
      });
    }
  },

  initialize: () => {
    if (typeof window !== 'undefined') {
      try {
        get().checkAuth();
      } catch (error) {
        console.error('Auth initialization error:', error);
        set({ 
          isInitialized: true, 
          isLoading: false,
          isAuthenticated: false,
          user: null,
          token: null
        });
      }
    } else {
      set({ 
        isInitialized: true, 
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null
      });
    }
  }
}));

// 로컬 스토리지에서 토큰 관리
export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },
  
  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
  },
  
  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
  }
};

// 사용자 정보 관리
export const userStorage = {
  get: (): any | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  set: (user: any): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('user');
  }
};

// API 요청 헤더 생성
export const getAuthHeaders = (): Record<string, string> => {
  const token = tokenStorage.get();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// 로그아웃 함수 (기존 호환성 유지)
export const logout = (): void => {
  tokenStorage.remove();
  userStorage.remove();
  window.location.href = '/';
};

// 토큰 유효성 검사
export const isTokenValid = (token: string): boolean => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch {
    return false;
  }
};

// 인증 상태 확인
export const isAuthenticated = (): boolean => {
  const token = tokenStorage.get();
  return token ? isTokenValid(token) : false;
}; 