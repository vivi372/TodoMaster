import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const authStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,

  setAccessToken: (token) =>
    set({
      accessToken: token,
      isAuthenticated: true,
    }),

  logout: () =>
    set({
      accessToken: null,
      isAuthenticated: false,
    }),
}));
