// frontEnd/src/features/todos/hooks/useTodos.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  todoApi,
  type TodoResponse,
  type CreateTodoRequest,
  type UpdateTodoRequest,
} from '@/features/todos/api/todoApi';
import { QUERY_KEYS } from '@/shared/const/queryKeys';
import { appToast } from '@/shared/utils/appToast';

/**
 * @description Todo 목록을 가져오는 useQuery 커스텀 훅.
 * @returns useQuery의 반환값 (data, isLoading, isError, error 등)
 */
export const useGetTodos = () => {
  return useQuery<TodoResponse[], Error>({
    // queryKey: Todo 목록을 식별하는 키
    queryKey: [QUERY_KEYS.todos],
    // queryFn: 데이터를 가져오는 비동기 함수
    queryFn: todoApi.getTodoList,
  });
};

/**
 * @description 새로운 Todo를 생성하는 useMutation 커스텀 훅.
 * @param {Object} options - useMutation에 전달할 추가 옵션 (예: onSuccess)
 * @returns useMutation의 반환값 (mutate, isPending 등)
 */
export const useCreateTodo = (options?: {
  onSuccess?: (data: TodoResponse) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation<TodoResponse, Error, CreateTodoRequest>({
    mutationFn: todoApi.createTodo,
    onSuccess: (data) => {
      // Todo 목록 쿼리를 무효화하여 최신 데이터로 갱신
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.todos] });
      // 성공 토스트 메시지 표시
      appToast.success({ message: 'Todo가 성공적으로 추가되었습니다.' });
      // 옵션으로 전달된 onSuccess 콜백 실행
      options?.onSuccess?.(data);
    },
    // onError는 queryClient에 설정된 전역 에러 핸들러가 처리
  });
};

/**
 * @description Todo를 수정하는 useMutation 커스텀 훅.
 * @returns useMutation의 반환값 (mutate, isPending 등)
 */
export const useUpdateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation<
    TodoResponse,
    Error,
    { id: number; payload: UpdateTodoRequest }
  >({
    // id와 payload를 받아 API 함수 호출
    mutationFn: ({ id, payload }) => todoApi.updateTodo(id, payload),
    /**
     * @description mutation이 성공적으로 완료되었을 때 실행됩니다.
     * 완료 토스트 메시지를 사용자에게 보여줍니다.
     */
    onSuccess: () => {
      appToast.success({ message: 'Todo 상태가 업데이트되었습니다.' });
    },
    /**
     * @description mutation이 성공하든 실패하든, 완료된 후에 항상 실행됩니다.
     * 여기서 Todo 목록 쿼리를 무효화(invalidate)하여 데이터 재조회를 유발합니다.
     *
     * 1. `queryClient.invalidateQueries`가 `QUERY_KEYS.todos`를 포함하는 모든 쿼리를 'stale' 상태로 만듭니다.
     * 2. `TodoPage.tsx`의 `useGetTodos` 훅이 사용하는 쿼리가 'stale' 상태가 되었으므로, React Query는 자동으로 데이터를 다시 가져옵니다(refetch).
     * 3. 새로운 데이터가 수신되면, `TodoPage.tsx` 컴포넌트가 리렌더링됩니다.
     * 4. `useMemo`로 계산된 `activeTodos`와 `completedTodos` 목록이 새로운 데이터로 다시 계산됩니다.
     * 5. 결과적으로, 완료 상태가 변경된 Todo 항목이 UI 상에서 '진행 중' 목록과 '완료됨' 목록 사이를 이동하게 됩니다.
     */
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.todos] });
    },
    // onError는 queryClient에 설정된 전역 에러 핸들러가 처리합니다.
  });
};

/**
 * @description Todo를 삭제하는 useMutation 커스텀 훅.
 * @returns useMutation의 반환값 (mutate, isPending 등)
 */
export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: todoApi.deleteTodo,
    onSuccess: () => {
      // Todo 목록 쿼리를 무효화하여 최신 데이터로 갱신
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.todos] });
      // 성공 토스트 메시지 표시
      appToast.success({ message: 'Todo가 성공적으로 삭제되었습니다.' });
    },
    // onError는 queryClient에 설정된 전역 에러 핸들러가 처리
  });
};
