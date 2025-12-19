import { api } from '@/lib/api/axios';
import type { LoginRequest, SocialLoginRequest, AuthResponse } from './../types/authTypes';
import type { ApiResponse } from '@/types/api';

const authUrl = '/api/auth';

export const authApi = {
  /**
   * 일반 로그인 api
   * * @param payload - 서버로 전송할 로그인 요청 데이터
   * @returns {Promise<AuthResponse>} - 로그인 성공 시 서버에서 받은 데이터 (예: 토큰)
   * @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  login: async (
    payload: LoginRequest, // 로그인 요청 시 필요한 데이터 타입
  ): Promise<AuthResponse> => {
    // 1. Axios를 사용하여 로그인 API에 POST 요청을 보냅니다.
    const res = await api.post<ApiResponse<AuthResponse>>(
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
   * @returns {Promise<AuthResponse>} - 로그인 성공 시 서버에서 받은 데이터 (예: 토큰)
   * @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  socialLogin: async (
    payload: SocialLoginRequest, // 로그인 요청 시 필요한 데이터 타입
  ): Promise<AuthResponse> => {
    // 1. Axios를 사용하여 로그인 API에 POST 요청을 보냅니다.
    // <ApiResponse<LoginResponse>>: 응답 데이터(res.data)의 타입이
    //                              ApiResponse<LoginResponse> 형태임을 명시합니다.
    const res = await api.post<ApiResponse<AuthResponse>>(
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
   *  refresh 토큰 재발급
   * @returns {Promise<AuthResponse>} - 로그인 성공 시 서버에서 받은 데이터 (예: 토큰)
   * @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  refresh: async (): Promise<AuthResponse> => {
    // 1. Axios를 사용하여 로그인 API에 POST 요청을 보냅니다.
    // <ApiResponse<LoginResponse>>: 응답 데이터(res.data)의 타입이
    //                              ApiResponse<LoginResponse> 형태임을 명시합니다.
    const res = await api.post<ApiResponse<AuthResponse>>(`${authUrl}/refresh`);

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
