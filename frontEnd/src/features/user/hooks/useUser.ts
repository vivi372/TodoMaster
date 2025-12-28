import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import type { UserProfileResponse, UserSummaryProfileResponse } from '../types/userTypes';

// 훅의 반환 타입을 정의합니다.
export interface UseAuthResult {
  profile: UserProfileResponse | undefined;
  headerProfile: UserSummaryProfileResponse | undefined;
  isLoading: boolean;
}

/**
 * 커스텀 훅 useUser
 * React Query를 사용하여 현재 로그인된 사용자 정보를 서버로부터 가져오는 훅
 * @returns {object} React Query의 useQueryResult 객체 (data, isLoading, isError, error 등 포함)
 */
export const useUser = (): UseAuthResult => {
  /** 헤더바에서 사용하는 프로필 데이터 가져오는 query */
  const headerProfileQuery = useQuery({
    // 1. queryKey: 쿼리를 식별하는 고유 키
    // ['headerProfile'] 키를 사용하여 이 쿼리를 캐시에 저장하고, 나중에 무효화(invalidate)하거나 재요청할 때 사용합니다.
    queryKey: ['headerProfile'],

    // 2. queryFn: 데이터를 가져오는 비동기 함수
    // userApi.getUserProfile 함수가 실제로 서버와 통신하여 사용자 요약 프로필 데이터를 반환합니다.
    queryFn: userApi.getUserSummaryProfile,
    staleTime: 1000 * 60 * 4, // Presigned URL 유효시간보다 짧게
  });

  /** 유저 프로필 데이터 가져오는 query */
  const profileQuery = useQuery({
    // 1. queryKey: 쿼리를 식별하는 고유 키
    // ['myProfile'] 키를 사용하여 이 쿼리를 캐시에 저장하고, 나중에 무효화(invalidate)하거나 재요청할 때 사용합니다.
    queryKey: ['myProfile'],

    // 2. queryFn: 데이터를 가져오는 비동기 함수
    // userApi.getUserProfile 함수가 실제로 서버와 통신하여 사용자 프로필 데이터를 반환합니다.
    queryFn: userApi.getUserProfile,

    // 3. staleTime: 데이터가 신선함을 유지하는 시간 설정
    // 1000 * 60 * 5 = 300000ms, 즉 5분으로 설정
    // 5분이 지나면 데이터는 '오래된(stale)' 상태가 되어 다음 이벤트 시점에 재요청됩니다.
    staleTime: 1000 * 60 * 5, // 5분
  });

  return {
    // useQuery
    // profileQuery 결과
    profile: profileQuery.data,
    // headerProfileQuery 결과
    headerProfile: headerProfileQuery.data,

    isLoading: profileQuery.isLoading || headerProfileQuery.isLoading,

    // useMutation
  };
};
