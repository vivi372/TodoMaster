// frontEnd/src/features/todos/hooks/useTodos.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type Todo, // TodoResponse 대신 Todo 타입을 사용합니다. Todo는 백엔드의 TodoResponseDto와 일치하는 표준화된 단일 Todo 데이터 타입입니다.
  type CreateTodoRequest,
  type UpdateTodoRequest,
} from '@/features/todos/api/todoApi';
import { todoQueryKeys } from '@/shared/const/queryKeys';
import { appToast } from '@/shared/utils/appToast';

/**
 * @description Todo 목록을 가져오는 useQuery 커스텀 훅.
 * @returns useQuery의 반환값 (data, isLoading, isError, error 등)
 */
export const useGetTodos = () => {
  return useQuery<Todo[], Error>({
    // queryKey: Todo 목록을 식별하는 키
    queryKey: todoQueryKeys.lists(),
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
  onSuccess?: (data: Todo) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation<Todo, Error, CreateTodoRequest>({
    mutationFn: todoApi.createTodo,
    onSuccess: (data) => {
      // Todo 목록 쿼리를 무효화하여 최신 데이터로 갱신
      queryClient.invalidateQueries({ queryKey: todoQueryKeys.all });
      // 성공 토스트 메시지 표시
      appToast.success({ message: 'Todo가 성공적으로 추가되었습니다.' });
      // 옵션으로 전달된 onSuccess 콜백 실행
      options?.onSuccess?.(data);
    },
    // 전역 에러 핸들러가 실행된 후, 추가적인 개별 에러 처리가 필요할 경우를 위해 onError 콜백을 호출합니다.
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

/**
 * @description Todo를 수정하는 useMutation 커스텀 훅.
 * @returns useMutation의 반환값 (mutate, isPending 등)
 */
export const useUpdateTodo = (options?: {
  onSuccess?: (data: Todo) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation<Todo, Error, { id: number; payload: UpdateTodoRequest }>({
    // id와 payload를 받아 API 함수 호출
    mutationFn: ({ id, payload }) => todoApi.updateTodo(id, payload),
    /**
     * @description mutation이 성공적으로 완료되었을 때 실행됩니다.
     * 완료 토스트 메시지를 사용자에게 보여줍니다.
     */
    onSuccess: (data) => {
      appToast.success({ message: '할 일이 성공적으로 수정되었습니다.' });
      // 옵션으로 전달된 onSuccess 콜백 실행
      options?.onSuccess?.(data);
    },
    /**
     * @description mutation이 성공하든 실패하든, 완료된 후에 항상 실행됩니다.
     * 여기서 Todo 목록 쿼리를 무효화(invalidate)하여 데이터 재조회를 유발합니다.
     */
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoQueryKeys.all });
    },
    // 전역 에러 핸들러가 실행된 후, 추가적인 개별 에러 처리가 필요할 경우를 위해 onError 콜백을 호출합니다.
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

import { todoApi, type DeleteTodoScope } from '@/features/todos/api/todoApi';

// ... (other parts of the file)

/**
 * @description Todo를 삭제하는 useMutation 커스텀 훅.
 *              삭제 성공 시, 전체 Todo 목록 쿼리와 삭제된 개별 Todo의 상세 쿼리를 무효화합니다.
 *              반복 일정 삭제를 위해 `scope` 파라미터를 받을 수 있도록 확장되었습니다.
 * @param {Object} options - `onSuccess`와 같은 뮤테이션 콜백 옵션.
 * @returns useMutation의 반환값 (mutate, isPending 등)
 */
export const useDeleteTodo = (options?: {
  onSuccess?: (deletedId: number) => void;
  onError?: () => void;
}) => {
  const queryClient = useQueryClient();

  // 뮤테이션 함수의 인자 타입을 객체로 변경하여 id와 scope를 함께 받도록 수정합니다.
  return useMutation<number, Error, { id: number; scope?: DeleteTodoScope }>({
    /**
     * @param {number} id - 삭제할 Todo의 ID
     * @param {DeleteTodoScope} [scope] - 반복 삭제 범위. 기본은 단일, 'FUTURE'는 현재 포함 미래, 'ALL_INCOMPLETE_REPEATED'는 모든 미완료 항목입니다.
     */
    mutationFn: async ({ id, scope }) => {
      // API 호출 시 id와 scope를 모두 전달합니다.
      await todoApi.deleteTodo(id, scope);
      return id; // 삭제된 todoId를 onSuccess 콜백으로 전달하기 위해 반환
    },
    onSuccess: (deletedId) => {
      // Todo 목록 쿼리를 무효화하여 최신 데이터로 갱신 (전체 리스트 업데이트)
      queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
      // 개별 Todo 쿼리도 무효화할 수 있습니다 (선택 사항).
      //queryClient.invalidateQueries({ queryKey: todoQueryKeys.detail(deletedId) });

      // 옵션으로 전달된 onSuccess 콜백 실행
      options?.onSuccess?.(deletedId);
    },
    onError: () => {
      // 옵션으로 전달된 onError 콜백 실행
      options?.onError?.();
    },
    // onError는 queryClient에 설정된 전역 에러 핸들러가 처리
  });
};
