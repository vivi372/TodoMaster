import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { userApi } from '../api/userApi';

/**
 * 커스텀 훅 useDeleteAccount
 * 회원 탈퇴를 진행하는 훅
 * @returns {UseMutationResult}
 */
export const useDeleteAccount = (): UseMutationResult<void, Error, void, unknown> => {
  // 회원 탈퇴 Mutation 정의
  return useMutation({
    // mutationFn: useMutation의 mutate가 호출될 때 전달된 인자를 받아,
    // authApi.acknowledgeImageWarning 함수에 맞는 형태로 가공하여 호출합니다.
    // 1. 서버에서 회원 삭제
    mutationFn: userApi.deleteAccount,
  });
};
