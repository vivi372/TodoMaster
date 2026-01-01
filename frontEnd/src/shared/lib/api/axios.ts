import axios, { type InternalAxiosRequestConfig } from 'axios';
import { authStore } from '@/features/auth/store/authStore';

/**
 * 기본 API 통신을 위한 Axios 인스턴스입니다.
 * 모든 요청에 기본 URL 및 인증 정보를 자동으로 포함하도록 설정됩니다.
 */
export const api = axios.create({
  // 1. baseURL 설정: 환경 변수(예: .env 파일)에서 API 서버의 기본 URL을 가져옵니다.
  baseURL: import.meta.env.VITE_API_BASE_URL,

  // 2. withCredentials 설정: 모든 요청에 쿠키(Cookies) 및 HTTP 인증 자격 증명(Authorization headers 등)을
  //    포함하여 보내도록 설정합니다. (주로 백엔드의 Refresh Token 쿠키를 보내기 위해 사용됨)
  withCredentials: true,
});

/**
 * 401 오류시 인터셉터로 refresh 요청시 무한 루프 가능성을 지우기 위한 Axios 인스턴스입니다.
 */
export const refreshApi = axios.create({
  // 1. baseURL 설정: 환경 변수(예: .env 파일)에서 API 서버의 기본 URL을 가져옵니다.
  baseURL: import.meta.env.VITE_API_BASE_URL,

  // 2. withCredentials 설정: 모든 요청에 쿠키(Cookies) 및 HTTP 인증 자격 증명(Authorization headers 등)을
  //    포함하여 보내도록 설정합니다. (주로 백엔드의 Refresh Token 쿠키를 보내기 위해 사용됨)
  withCredentials: true,
});

// 토큰 갱신 상태 관리 변수
let isRefreshing = false; // 현재 토큰 갱신 요청이 진행 중인지 여부를 나타내는 플래그
let failedQueue: Array<(token: string) => void> = []; // 토큰 갱신 대기열: 401 오류로 인해 실패하고 갱신이 완료되기를 기다리는 요청들을 저장하는 배열

// 요청 인터셉터 (Request Interceptor)
// 서버로 요청을 보내기 직전에 실행됩니다.
api.interceptors.request.use((config) => {
  // Zustand 스토어에서 현재 Access Token 상태를 가져옵니다. (컴포넌트 밖이므로 getState() 사용)
  const token = authStore.getState().accessToken;

  // 토큰이 존재하면 요청 헤더에 Authorization 필드를 추가합니다.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config; // 수정된 config(헤더 포함)를 반환하여 요청을 진행합니다.
});

/**
 * 응답 인터셉터 설정: API 응답이 도착할 때 전역적으로 처리하는 로직입니다.
 * 주로 오류 응답을 표준화하고, 오류 메시지를 추출하여 반환하는 데 사용됩니다.
 */
api.interceptors.response.use(
  // 1. 성공 응답(fulfilled) 처리 핸들러:
  //    응답이 성공(HTTP 2xx)일 경우, 응답 객체(res)를 그대로 통과시킵니다.
  (res) => res,

  // 2. 오류 응답(rejected) 처리 핸들러:
  //    응답이 오류(HTTP 4xx, 5xx 또는 네트워크 오류)일 경우 실행됩니다.
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    }; // 실패한 원래 요청의 설정을 보존합니다.

    // 4.1. Access Token 만료 확인 (401 Unauthorized)
    // 401 에러이고, _retry 플래그가 설정되지 않은 경우 (무한 재시도 방지)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 재시도 플래그를 true로 설정합니다.

      // 4.2. 토큰 갱신 중이라면 (isRefreshing === true)
      if (isRefreshing) {
        // 현재 요청은 갱신 대기열에 들어갑니다.
        return new Promise((resolve) => {
          // 갱신이 완료되면 호출될 콜백 함수를 대기열에 추가합니다.
          failedQueue.push((token) => {
            // 새 토큰으로 헤더를 업데이트하고
            originalRequest.headers.Authorization = `Bearer ${token}`;
            // 원래 요청을 재실행한 결과를 resolve하여 응답합니다.
            resolve(api(originalRequest));
          });
        });
      }

      // 4.3. 토큰 갱신 시작 (isRefreshing === false)
      isRefreshing = true; // 갱신 플래그를 설정하여 다른 요청을 대기열로 보냅니다.
      try {
        // Refresh Token을 사용하여 새 Access Token을 요청합니다.
        const res = await refreshApi.post('/api/auth/refresh');
        const newAccessToken = res.data.data.accessToken;
        // 1. 새 토큰을 Zustand 스토어에 저장합니다.
        authStore.getState().setAccessToken(newAccessToken);
        // 2. 대기열에 있던 모든 요청들을 새 토큰으로 재실행합니다.
        failedQueue.forEach((cb) => cb(newAccessToken));
        failedQueue = []; // 대기열을 비웁니다.
        // 3. 현재 실패했던 원본 요청을 새 토큰으로 헤더를 업데이트하고 재실행합니다.
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        // Refresh Token 요청마저 실패한 경우 (Refresh Token 만료 또는 유효하지 않음)
        // 1. 사용자를 로그아웃 처리하고
        authStore.getState().logout();
        // 2. 로그인 페이지로 강제 이동시킵니다.
        window.location.href = '/login';
        return new Promise(() => {});
      } finally {
        // 토큰 갱신 프로세스가 완료되었으므로 플래그를 해제합니다.
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
