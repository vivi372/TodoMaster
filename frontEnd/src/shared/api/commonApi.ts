import { api } from '@/shared/lib/api/axios';
import type { ApiResponse } from '@/shared/types/api';

export interface PresignRequest {
  directory: string;
  contentType: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  objectKey: string;
}

export const commonApi = {
  /**
   * PresignedUrl 발급 api
   * @param payload - 서버로 전송할  PresignedUrl 발급 요청 데이터
   * @returns {Promise<PresignedUrlResponse>} - PresignedUrl 발급 성공 시 서버에서 받은 데이터 (예: PresignedUrl)
   * @throws {Error} - 서버 응답의 'success' 필드가 false일 경우, 응답 메시지를 포함한 오류 발생
   */
  getPresignedUrl: async (payload: PresignRequest): Promise<PresignedUrlResponse> => {
    // 1. Axios를 사용하여 PresignedUrl 발급 API에 POST 요청을 보냅니다.
    const res = await api.post<ApiResponse<PresignedUrlResponse>>(
      '/api/common/files/presign',
      payload,
    );

    // 2. 응답 데이터의 성공 여부 확인
    // 서버에서 정의한 ApiResponse 구조의 'success' 필드가 false인 경우,
    // 즉, HTTP 상태 코드가 200이라도 비즈니스 로직 상의 오류가 발생한 경우 처리합니다.
    if (!res.data.success) {
      // ApiResponse의 메시지 필드를 포함하여 오류를 발생시킵니다.
      throw res.data;
    }

    // 3. PresignedUrl 성공 시
    // 서버가 보낸 ApiResponse 객체 내부의 실제 데이터(data) 필드를 반환합니다.
    return res.data.data;
  },
};
