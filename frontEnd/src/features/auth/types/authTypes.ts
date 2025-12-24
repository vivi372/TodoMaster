export interface LoginRequest {
  email: string;
  password: string;
}

export interface SocialLoginRequest {
  provider: 'google' | 'kakao';
  code: string;
}

export interface ResendRequest {
  email: string;
}

export interface AccountActivationRequest {
  token: string;
}

export interface signupRequest {
  email: string;
  password: string;
  nickname: string;
  profileImg: string | null;
}

export interface AuthResponse {
  accessToken: string;
}
