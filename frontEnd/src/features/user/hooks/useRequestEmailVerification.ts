import { useMutation } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import type { AppError } from '@/shared/error/types';
import type { RequestEmailVerificationBody } from '../types/userTypes';

/**
 * @description 이메일 변경을 위한 인증 코드 전송을 요청하는 뮤테이션 훅입니다.
 * @param onSuccess 뮤테이션 성공 시 실행될 콜백 함수입니다.
 * @returns React Query의 뮤테이션 객체를 반환합니다.
 */
export const useRequestEmailVerification = (onSuccess: () => void) => {
  return useMutation<void, AppError, RequestEmailVerificationBody>({
    mutationFn: userApi.requestEmailVerification,
    onSuccess,
  });
};
