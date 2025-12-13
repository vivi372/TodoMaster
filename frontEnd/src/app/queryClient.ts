import { QueryClient } from '@tanstack/react-query';
// 전역 토스트 알림을 관리하는 Zustand 스토어를 가져옵니다.
import { useToastStore } from '@/shared/store/toastStore';

/**
 * 애플리케이션 전체에서 공유될 QueryClient 인스턴스입니다.
 * 데이터 캐싱, 재검증, 전역 오류 처리 등의 핵심 설정을 담당합니다.
 */
export const queryClient = new QueryClient({
  // --- 1. 기본 옵션 (defaultOptions) ---
  // 개별 쿼리 훅(useQuery, useMutation)에서 옵션을 명시하지 않았을 때 적용되는 기본 설정입니다.
  defaultOptions: {
    // 1-1. 데이터 조회 쿼리 (useQuery)에 대한 기본 설정
    queries: {
      // API 요청 실패 시 재시도 횟수:
      // 기본값은 3이지만, 여기서는 1번만 재시도하도록 설정하여 불필요한 서버 부하를 줄입니다.
      retry: 1,

      // 윈도우 포커스 시 재요청:
      // 사용자가 창을 다시 포커스했을 때 자동으로 데이터를 다시 가져오지 않도록 설정합니다. (성능 최적화)
      refetchOnWindowFocus: false,

      // 오류 발생 시 컴포넌트 레벨로 에러를 던지지 않도록 설정 (전역 핸들러에서 처리)
      throwOnError: false,
    },
    // 1-2. 데이터 변경 뮤테이션 (useMutation)에 대한 기본 설정
    mutations: {
      // 오류 발생 시 에러를 던지지 않고 MutationCache에서 처리하도록 설정
      throwOnError: false,
    },
  },

  // 쿼리 캐시 설정 (queryCache) ---
  // 모든 useQuery 호출에서 오류가 발생했을 때 실행되는 전역 핸들러입니다.
  queryCache: new (QueryClient as any)().getQueryCache().constructor({
    // 타입스크립트의 엄격한 검사를 우회하기 위해 QueryClient를 'any'로 캐스팅하고,
    // 기존의 쿼리 캐시 인스턴스의 생성자(constructor)를 가져와 새로운 옵션으로 생성합니다.
    onError: (error: unknown) => {
      // QueryCache의 전역 오류 처리 로직

      // a. Toast Store의 show 액션을 가져옵니다. (컴포넌트 바깥에서 상태를 변경하는 방식)
      const { show } = useToastStore.getState();

      // b. 표시할 오류 메시지를 결정합니다.
      const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'; // 데이터 조회(Query) 오류 기본 메시지

      // c. Toast Store를 사용하여 오류 알림을 띄웁니다.
      show(message, 'error');
    },
  }),

  // 뮤테이션 캐시 설정 (mutationCache) ---
  // 모든 useMutation 호출에서 오류가 발생했을 때 실행되는 전역 핸들러입니다.
  mutationCache: new (QueryClient as any)().getMutationCache().constructor({
    // QueryCache와 동일하게, 타입스크립트 오류를 회피하기 위해 우회적인 방법을 사용합니다.
    onError: (error: unknown) => {
      // MutationCache의 전역 오류 처리 로직

      // a. Toast Store의 show 액션을 가져옵니다.
      const { show } = useToastStore.getState();

      // b. 표시할 오류 메시지를 결정합니다.
      const message = error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다.'; // 데이터 변경(Mutation) 오류 기본 메시지

      // c. Toast Store를 사용하여 오류 알림을 띄웁니다.
      show(message, 'error');
    },
  }),
});
