import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import { queryClient } from '@/app/queryClient';

/**
 * 커스텀 훅 useAcknowledgeImageWarning
 * 이미지 경고 확인 여부 변경을 진행하는 훅
 * @returns {object} React Query의 useQueryResult 객체 (data, isLoading, isError, error 등 포함)
 */
export const useAcknowledgeImageWarning = (): UseMutationResult<void, Error, void, unknown> => {
  /** 이미지 경고 확인 여부 변경 Mutation 정의*/
  return useMutation({
    // mutationFn: useMutation의 mutate가 호출될 때 전달된 인자를 받아,
    // authApi.acknowledgeImageWarning 함수에 맞는 형태로 가공하여 호출합니다.
    mutationFn: userApi.acknowledgeImageWarning,

    // 이미지 경고 확인 여부 변경후 headerProfile 캐시를 무효화해 다시 가져오기
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['headerProfile'] });
    },
  });
};
