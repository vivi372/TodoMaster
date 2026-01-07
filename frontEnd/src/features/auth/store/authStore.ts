import { create } from 'zustand';
import type { LoginResponse } from '../types/authTypes';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean; // 인증 여부 변수
  isAuthInitialized: boolean; // 인증 시스템이 초기화되었는지 여부 변수
  provider: 'google' | 'kakao' | 'standard' | null; // 로그인 제공자

  setLogin: (loginResponse: LoginResponse) => void;
  setAuthInitialized: () => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
}

export const authStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  isAuthInitialized: false,
  provider: null,

  setLogin: (loginResponse) =>
    set({
      accessToken: loginResponse.accessToken,
      provider: loginResponse.provider,
      isAuthenticated: true,
    }),
  setAuthInitialized: () => set({ isAuthInitialized: true }),
  logout: () =>
    set({
      accessToken: null,
      isAuthenticated: false,
      provider: null,
    }),
  setAccessToken: (token) =>
    set({
      accessToken: token,
      isAuthenticated: true,
    }),
}));
