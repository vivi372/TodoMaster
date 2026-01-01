import { useMutation } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import type { AppError } from '@/shared/error/types';
import type { RequestKakaoEmailChangeVerificationBody } from '../types/userTypes';

/**
 * @description [카카오 사용자용] 이메일 변경을 위한 인증 코드 전송을 요청하는 뮤테이션 훅입니다.
 * @param onSuccess 뮤테이션 성공 시 실행될 콜백 함수입니다.
 * @returns React Query의 뮤테이션 객체를 반환합니다.
 */
export const useRequestKakaoEmailChangeVerification = (onSuccess: () => void) => {
  return useMutation<void, AppError, RequestKakaoEmailChangeVerificationBody>({
    mutationFn: userApi.requestKakaoEmailChangeVerification,
    onSuccess,
  });
};
