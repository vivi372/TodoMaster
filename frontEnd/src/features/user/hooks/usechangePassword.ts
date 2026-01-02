import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import type { ChangePasswordBody } from '../types/userTypes';

/**
 * 사용자 비밀번호 변경을 위한 커스텀 훅 (Mutation Hook)
 */
export const useChangePassword = (): UseMutationResult<
  void,
  Error,
  ChangePasswordBody,
  unknown
> => {
  return useMutation({
    /**
     * @property {function(ChangePasswordBody): Promise<void>} mutationFn
     * 비밀번호 변경을 수행할 실제 API 통신 함수
     */
    mutationFn: userApi.changePassword,
  });
};
