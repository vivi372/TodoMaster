import type { ApiResponse } from '@/shared/types/api';
import type { UserProfileResponse, UserSummaryProfileResponse } from '../types/userTypes';
import { api } from '@/shared/lib/api/axios';

const userUrl = '/api/user';

export const userApi = {
  /**
   * 유저 요약 프로필 가져오기 api
   * @returns {Promise<UserSummaryProfileResponse>} -  유저 프로필 정보 (헤더에 사용되는 닉네임 / 프로필 이미지)
   * @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  getUserSummaryProfile: async (): Promise<UserSummaryProfileResponse> => {
    // 1. Axios를 사용하여 유저 요약 프로필 가져오기 api에 GET 요청을 보냅니다.
    const res = await api.get<ApiResponse<UserSummaryProfileResponse>>(
      `${userUrl}/me/summary`, // 유저 프로필 가져오기 api 엔드포인트
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
   * 이미지 경고 확인 여부 변경 api
   * @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  acknowledgeImageWarning: async (): Promise<void> => {
    // 1. Axios를 사용하여 유저 요약 프로필 가져오기 api에 POST 요청을 보냅니다.
    const res = await api.post<ApiResponse<void>>(
      `${userUrl}/acknowledge-image-warning`, // 이미지 경고 확인 여부 변경 api 엔드포인트
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
   * 유저 프로필 가져오기 api
   * @returns {Promise<UserProfileResponse>} -  유저 프로필 정보
   * @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  getUserProfile: async (): Promise<UserProfileResponse> => {
    // 1. Axios를 사용하여 유저 프로필 가져오기 api에 GET 요청을 보냅니다.
    const res = await api.get<ApiResponse<UserProfileResponse>>(
      `${userUrl}/me`, // 유저 프로필 가져오기 api 엔드포인트
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
};
