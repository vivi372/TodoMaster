import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import { authStore } from '@/features/auth/store/authStore';
import type { UserSummaryProfileResponse } from '../types/userTypes';
import { userQueryKeys } from '@/shared/const/queryKeys';

// 커스텀 훅의 반환 타입을 정의합니다.
// UseQueryResult에 TData(UserSummaryProfileResponse)와 TError(Error)를 명시
type HeaderProfileQueryResult = UseQueryResult<UserSummaryProfileResponse, Error>;

/**
 * 커스텀 훅 useUser
 * React Query를 사용하여 헤더에 표시되는 프로필 정보를 서버로부터 가져오는 훅
 * @returns {object} React Query의 useQueryResult 객체 (data, isLoading, isError, error 등 포함)
 */
export const useHeaderProfile = (): HeaderProfileQueryResult => {
  const isAuthenticated = authStore.getState().isAuthenticated;

  /** 헤더바에서 사용하는 프로필 데이터 가져오는 query */
  return useQuery({
    // 1. queryKey: 쿼리를 식별하는 고유 키
    // ['headerProfile'] 키를 사용하여 이 쿼리를 캐시에 저장하고, 나중에 무효화(invalidate)하거나 재요청할 때 사용합니다.
    queryKey: userQueryKeys.summary(),

    // 2. queryFn: 데이터를 가져오는 비동기 함수
    // userApi.getUserProfile 함수가 실제로 서버와 통신하여 사용자 요약 프로필 데이터를 반환합니다.
    queryFn: userApi.getUserSummaryProfile,

    staleTime: 1000 * 60 * 4, // Presigned URL 유효시간보다 짧게

    // 인증 상태가 true일 때만 이 쿼리를 실행합니다.
    enabled: isAuthenticated,
  });
};
