import { todoQueryKeys } from '@/shared/const/queryKeys';
import { useQuery } from '@tanstack/react-query';
import { todoApi } from '../api/todoApi';

/**
 * //* useTodo
 * Todo 단일 항목을 조회하는 비동기 훅입니다.
 * @param todoId Todo 항목의 ID
 * @returns isLoading, isError, data를 포함하는 useQuery 객체
 */
export const useTodo = (todoId: number) => {
  return useQuery({
    queryKey: todoQueryKeys.detail(todoId),
    queryFn: () => todoApi.getTodoById(todoId),
    enabled: !!todoId, // todoId가 있을 때만 쿼리 실행
  });
};
