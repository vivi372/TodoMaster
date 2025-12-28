import { parseAxiosError } from '@/shared/api/parseAxiosError';
import { handleServerError } from '@/shared/utils/handleServerError';
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

/**
 * 전역 QueryClient 설정
 *
 * 역할 분리 원칙:
 * - Axios Interceptor: 에러 메시지 정규화 + throw
 * - QueryCache: 서버 데이터 조회(Query) 실패 처리
 * - MutationCache: 데이터 변경(Mutation) 실패 처리
 */
export const queryClient = new QueryClient({
  /**
   * ------------------------------
   * Query 전역 에러 처리 (useQuery)
   * ------------------------------
   */
  queryCache: new QueryCache({
    onError: async (error: unknown) => {
      const appError = parseAxiosError(error);

      console.error(appError);

      const didExecuteAction = await handleServerError(appError);

      if (didExecuteAction) {
        // 액션이 실행(페이지 이동 등)되었다면 추가 로직 불필요
        return;
      }
    },
  }),

  /**
   * --------------------------------
   * Mutation 전역 에러 처리 (useMutation)
   * --------------------------------
   */
  mutationCache: new MutationCache({
    onError: async (error: unknown) => {
      const appError = parseAxiosError(error);

      console.error(appError);

      const didExecuteAction = await handleServerError(appError);

      if (didExecuteAction) {
        // 액션이 실행(페이지 이동 등)되었다면 추가 로직 불필요
        return;
      }
    },
  }),

  /**
   * ------------------------------
   * 기본 옵션
   * ------------------------------
   */
  defaultOptions: {
    queries: {
      retry: 1, // 무한 재시도 방지
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30초
    },
  },
});
