import axios from 'axios';

/**
 * 발생한 오류(error) 객체에서 사용자에게 보여줄 적절한 오류 메시지를 추출합니다.
 * 주로 Axios를 통해 API 통신을 하다가 서버에서 오류 응답을 받았을 때 사용됩니다.
 *
 * @param error 발생한 오류 객체 (unknown 타입)
 * @returns 추출된 오류 메시지 문자열
 */
export const getAxiosErrorMessage = (error: unknown): string => {
  // 1. 오류 객체가 AxiosError 인스턴스인지 확인합니다.
  if (axios.isAxiosError(error)) {
    return (
      // 2. 서버 응답 본문(response.data)에서 가장 구체적인 메시지를 순서대로 시도합니다.
      //    a. 서버가 커스텀 메시지를 담아 보낸 경우 (e.g., Spring Boot의 API Response DTO)
      error.response?.data?.message ||
      //    b. 서버가 일반적인 오류 객체 필드(error)를 사용한 경우
      error.response?.data?.error ||
      //    c. 응답이 없거나 통신 자체의 오류인 경우 (e.g., 네트워크 오류, 타임아웃 등) Axios 자체의 오류 메시지
      error.message ||
      // 3. 위 모두 실패 시 기본값 반환
      '알 수 없는 서버 오류'
    );
  }

  // 4. AxiosError가 아닌 다른 종류의 오류(예: Type Error, Reference Error)가 발생한 경우
  return '예상치 못한 오류가 발생했습니다.';
};
