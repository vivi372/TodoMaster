import axios from 'axios';
import { getAxiosErrorMessage } from '../utils/axiosError';

/**
 * 기본 API 통신을 위한 Axios 인스턴스입니다.
 * 모든 요청에 기본 URL 및 인증 정보를 자동으로 포함하도록 설정됩니다.
 */
export const api = axios.create({
  // 1. baseURL 설정: 환경 변수(예: .env 파일)에서 API 서버의 기본 URL을 가져옵니다.
  baseURL: import.meta.env.VITE_API_URL,

  // 2. withCredentials 설정: 모든 요청에 쿠키(Cookies) 및 HTTP 인증 자격 증명(Authorization headers 등)을
  //    포함하여 보내도록 설정합니다. (주로 백엔드의 Refresh Token 쿠키를 보내기 위해 사용됨)
  withCredentials: true,
});

/**
 * 응답 인터셉터 설정: API 응답이 도착할 때 전역적으로 처리하는 로직입니다.
 * 주로 오류 응답을 표준화하고, 오류 메시지를 추출하여 반환하는 데 사용됩니다.
 */
api.interceptors.response.use(
  // 1. 성공 응답(fulfilled) 처리 핸들러:
  //    응답이 성공(HTTP 2xx)일 경우, 응답 객체(res)를 그대로 통과시킵니다.
  (res) => res,

  // 2. 오류 응답(rejected) 처리 핸들러:
  //    응답이 오류(HTTP 4xx, 5xx 또는 네트워크 오류)일 경우 실행됩니다.
  (error) => {
    // a. 오류 메시지 추출: 유틸리티 함수를 사용하여 AxiosError 객체에서
    //    서버 메시지(data.message)나 표준 오류 메시지를 추출합니다.
    const msg = getAxiosErrorMessage(error);

    // b. Promise.reject 반환: 추출된 메시지를 담은 새로운 Error 객체를 생성하여
    //    호출자(컴포넌트/서비스)에게 오류를 발생시킵니다.
    //    이렇게 하면 호출자는 .catch 블록에서 정제된 오류 메시지를 받게 됩니다.
    return Promise.reject(new Error(msg));
  },
);
