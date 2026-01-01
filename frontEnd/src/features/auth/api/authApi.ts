import { api, refreshApi } from '@/shared/lib/api/axios';
import type {
  LoginRequest,
  SocialLoginRequest,
  LoginResponse,
  signupRequest,
  ResendRequest,
  AccountActivationRequest,
  PasswordForgotRequest,
  PasswordResetRequest,
} from './../types/authTypes';
import type { ApiResponse } from '@/shared/types/api';

const authUrl = '/api/auth';

export const authApi = {
  /**
   * 일반 로그인 api
   * * @param payload - 서버로 전송할 로그인 요청 데이터
   * @returns {Promise<LoginResponse>} - 로그인 성공 시 서버에서 받은 데이터 (예: 토큰)
   * @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  login: async (
    payload: LoginRequest, // 로그인 요청 시 필요한 데이터 타입
  ): Promise<LoginResponse> => {
    // 1. Axios를 사용하여 로그인 API에 POST 요청을 보냅니다.
    const res = await api.post<ApiResponse<LoginResponse>>(
      `${authUrl}/login`, // 로그인 API 엔드포인트
      payload, // 요청 본문(Body)에 로그인 요청 데이터를 포함
    );

    // 2. 응답 데이터의 성공 여부 확인
    // 서버에서 정의한 ApiResponse 구조의 'success' 필드가 false인 경우,
    // 즉, HTTP 상태 코드가 200이라도 비즈니스 로직 상의 오류가 발생한 경우 처리합니다.
    if (!res.data.success) {
      // ApiResponse의 메시지 필드를 포함하여 오류를 발생시킵니다.
      throw res.data;
    }

    // 3. 로그인 성공 시
    // 서버가 보낸 ApiResponse 객체 내부의 실제 데이터(data) 필드를 반환합니다.
    return res.data.data;
  },

  /**
   * 소셜 로그인 api
   * * @param payload - 서버로 전송할 로그인 요청 데이터
   * @returns {Promise<LoginResponse>} - 로그인 성공 시 서버에서 받은 데이터 (예: 토큰)
   * @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  socialLogin: async (
    payload: SocialLoginRequest, // 로그인 요청 시 필요한 데이터 타입
  ): Promise<LoginResponse> => {
    // 1. Axios를 사용하여 로그인 API에 POST 요청을 보냅니다.
    // <ApiResponse<LoginResponse>>: 응답 데이터(res.data)의 타입이
    //                              ApiResponse<LoginResponse> 형태임을 명시합니다.
    const res = await api.post<ApiResponse<LoginResponse>>(
      `${authUrl}/social/login`, // 소셜 로그인 API 엔드포인트
      payload, // 요청 본문(Body)에 로그인 요청 데이터를 포함
    );

    // 2. 응답 데이터의 성공 여부 확인
    // 서버에서 정의한 ApiResponse 구조의 'success' 필드가 false인 경우,
    // 즉, HTTP 상태 코드가 200이라도 비즈니스 로직 상의 오류가 발생한 경우 처리합니다.
    if (!res.data.success) {
      // ApiResponse의 메시지 필드를 포함하여 오류를 발생시킵니다.
      throw res.data;
    }

    // 3. 로그인 성공 시
    // 서버가 보낸 ApiResponse 객체 내부의 실제 데이터(data) 필드를 반환합니다.
    return res.data.data;
  },

  /**
   * 회원가입 api
   * * @param payload - 서버로 전송할 회원가입 요청 데이터
   * @returns {Promise<void>} - 회원가입 성공시 받을 데이터
   * @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  signup: async (
    payload: signupRequest, // 로그인 요청 시 필요한 데이터 타입
  ): Promise<void> => {
    // 1. Axios를 사용하여 로그인 API에 POST 요청을 보냅니다.
    const res = await api.post<ApiResponse<void>>(
      `${authUrl}/signup`, // 로그인 API 엔드포인트
      payload, // 요청 본문(Body)에 로그인 요청 데이터를 포함
    );

    // 2. 응답 데이터의 성공 여부 확인
    // 서버에서 정의한 ApiResponse 구조의 'success' 필드가 false인 경우,
    // 즉, HTTP 상태 코드가 200이라도 비즈니스 로직 상의 오류가 발생한 경우 처리합니다.
    if (!res.data.success) {
      // ApiResponse의 메시지 필드를 포함하여 오류를 발생시킵니다.
      throw res.data;
    }
  },

  /**
   * 인증 이메일 재전송 api
   * * @param payload - 서버로 전송할 폼의 이메일
   * @returns {Promise<void>} - 인증 이메일 재전송 성공시 받을 데이터
   * @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  resendVerificationEmail: async (
    payload: ResendRequest, // 로그인 요청 시 필요한 데이터 타입
  ): Promise<void> => {
    // 1. Axios를 사용하여 인증 이메일 재전송 API에 POST 요청을 보냅니다.
    const res = await api.post<ApiResponse<void>>(
      `${authUrl}/rseend`, // 이메일 재전송 API 엔드포인트
      payload,
    );

    // 2. 응답 데이터의 성공 여부 확인
    // 서버에서 정의한 ApiResponse 구조의 'success' 필드가 false인 경우,
    // 즉, HTTP 상태 코드가 200이라도 비즈니스 로직 상의 오류가 발생한 경우 처리합니다.
    if (!res.data.success) {
      // ApiResponse의 메시지 필드를 포함하여 오류를 발생시킵니다.
      throw res.data;
    }
  },

  /**
   * 계정 활성화 api
   * * @param payload - 서버로 전송할 인증 토큰
   * @returns {Promise<void>} - 계정 활성화 성공시 받을 데이터
   * @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  accountActivation: async (
    payload: AccountActivationRequest, // 로그인 요청 시 필요한 데이터 타입
  ): Promise<void> => {
    // 1. Axios를 사용하여 계정 활성화 API에 POST 요청을 보냅니다.
    const res = await api.post<ApiResponse<void>>(
      `${authUrl}/account-activation`, // 계정 활성화 API 엔드포인트
      payload,
    );

    // 2. 응답 데이터의 성공 여부 확인
    // 서버에서 정의한 ApiResponse 구조의 'success' 필드가 false인 경우,
    // 즉, HTTP 상태 코드가 200이라도 비즈니스 로직 상의 오류가 발생한 경우 처리합니다.
    if (!res.data.success) {
      // ApiResponse의 메시지 필드를 포함하여 오류를 발생시킵니다.
      throw res.data;
    }
  },

  /**
   * 비밀번호 찾기 api
   * * @param payload - 서버로 전송할 이메일
   *   @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  passwordForgot: async (
    payload: PasswordForgotRequest, // 비밀번호 찾기시 필요한 데이터 타입
  ): Promise<void> => {
    // 1. Axios를 사용하여 비밀번호 찾기 API에 POST 요청을 보냅니다.
    const res = await api.post<ApiResponse<void>>(
      `${authUrl}/password/forgot`, // 비밀번호 찾기 API 엔드포인트
      payload,
    );

    // 2. 응답 데이터의 성공 여부 확인
    // 서버에서 정의한 ApiResponse 구조의 'success' 필드가 false인 경우,
    // 즉, HTTP 상태 코드가 200이라도 비즈니스 로직 상의 오류가 발생한 경우 처리합니다.
    if (!res.data.success) {
      // ApiResponse의 메시지 필드를 포함하여 오류를 발생시킵니다.
      throw res.data;
    }
  },

  /**
   * 비밀번호 리셋 토큰 검증 api
   * * @param resetToken - 서버로 전송할 리셋 토큰
   * @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  validateResetToken: async (
    resetToken: string | undefined, // 비밀번호 리셋 토큰 검증 요청 시 필요한 데이터 타입
  ): Promise<void> => {
    const payload = {
      resetToken: resetToken,
    };
    // 1. Axios를 사용하여 비밀번호 리셋 토큰 검증 API에 POST 요청을 보냅니다.
    const res = await api.post<ApiResponse<void>>(
      `${authUrl}/password/reset/validation`, // 비밀번호 리셋 토큰 검증 API 엔드포인트
      payload,
    );

    // 2. 응답 데이터의 성공 여부 확인
    // 서버에서 정의한 ApiResponse 구조의 'success' 필드가 false인 경우,
    // 즉, HTTP 상태 코드가 200이라도 비즈니스 로직 상의 오류가 발생한 경우 처리합니다.
    if (!res.data.success) {
      // ApiResponse의 메시지 필드를 포함하여 오류를 발생시킵니다.
      throw res.data;
    }
  },

  /**
   * 비밀번호 재설정 api
   * * @param payload - 서버로 전송할 비밀번호
   *   @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  passwordReset: async (
    payload: PasswordResetRequest, // 비밀번호 재설정시 필요한 데이터 타입
  ): Promise<void> => {
    // 1. Axios를 사용하여 비밀번호 찾기 API에 POST 요청을 보냅니다.
    const res = await api.post<ApiResponse<void>>(
      `${authUrl}/password/reset`, // 비밀번호 재설정 API 엔드포인트
      payload,
    );

    // 2. 응답 데이터의 성공 여부 확인
    // 서버에서 정의한 ApiResponse 구조의 'success' 필드가 false인 경우,
    // 즉, HTTP 상태 코드가 200이라도 비즈니스 로직 상의 오류가 발생한 경우 처리합니다.
    if (!res.data.success) {
      // ApiResponse의 메시지 필드를 포함하여 오류를 발생시킵니다.
      throw res.data;
    }
  },

  /**
   *  refresh 토큰 재발급
   * @returns {Promise<LoginResponse>} - 로그인 성공 시 서버에서 받은 데이터 (예: 토큰)
   * @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  refresh: async (): Promise<LoginResponse> => {
    // 1. Axios를 사용하여 로그인 API에 POST 요청을 보냅니다.
    // <ApiResponse<LoginResponse>>: 응답 데이터(res.data)의 타입이
    //                              ApiResponse<LoginResponse> 형태임을 명시합니다.
    const res = await refreshApi.post<ApiResponse<LoginResponse>>(`${authUrl}/refresh`);

    console.log(res);

    // 2. 응답 데이터의 성공 여부 확인
    // 서버에서 정의한 ApiResponse 구조의 'success' 필드가 false인 경우,
    // 즉, HTTP 상태 코드가 200이라도 비즈니스 로직 상의 오류가 발생한 경우 처리합니다.
    if (!res.data.success) {
      throw res.data;
    }

    // 3. 로그인 성공 시
    // 서버가 보낸 ApiResponse 객체 내부의 실제 데이터(data) 필드를 반환합니다.
    return res.data.data;
  },

  /**
   *  로그아웃
   * @returns {Promise<void>} - 로그인 성공 시 서버에서 받은 데이터 (예: 토큰)
   * @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  logout: async (): Promise<void> => {
    // 1. Axios를 사용하여 로그인 API에 POST 요청을 보냅니다.
    // <ApiResponse<LoginResponse>>: 응답 데이터(res.data)의 타입이
    //                              ApiResponse<LoginResponse> 형태임을 명시합니다.
    const res = await api.post<ApiResponse<void>>(`${authUrl}/logout`);

    // 2. 응답 데이터의 성공 여부 확인
    // 서버에서 정의한 ApiResponse 구조의 'success' 필드가 false인 경우,
    // 즉, HTTP 상태 코드가 200이라도 비즈니스 로직 상의 오류가 발생한 경우 처리합니다.
    if (!res.data.success) {
      throw res.data;
    }

    // 3. 로그인 성공 시
    // 서버가 보낸 ApiResponse 객체 내부의 실제 데이터(data) 필드를 반환합니다.
    return res.data.data;
  },
};
