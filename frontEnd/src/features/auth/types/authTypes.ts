export interface LoginRequest {
  email: string;
  password: string;
}

export interface SocialLoginRequest {
  provider: 'google' | 'kakao';
  code: string;
}

export interface AuthResponse {
  accessToken: string;
}
