import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean; // 인증 여부 변수
  isAuthInitialized: boolean; // 인증 시스템이 초기화되었는지 여부 변수

  setAccessToken: (token: string) => void;
  setAuthInitialized: () => void;
  logout: () => void;
}

export const authStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  isAuthInitialized: false,

  setAccessToken: (token) =>
    set({
      accessToken: token,
      isAuthenticated: true,
    }),
  setAuthInitialized: () => set({ isAuthInitialized: true }),
  logout: () =>
    set({
      accessToken: null,
      isAuthenticated: false,
    }),
}));
