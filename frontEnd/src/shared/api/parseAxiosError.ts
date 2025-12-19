import axios from 'axios';
import type { AppError } from '@/shared/error/types';

/**
 * AxiosError → AppError 변환 함수
 * React Query / Mutation / Interceptor 전부 이걸 통과시킨다
 */
export function parseAxiosError(error: unknown): AppError {
  if (!axios.isAxiosError(error)) {
    return {
      title: '알 수 없는 오류가 발생했습니다.',
      description: '',
    };
  }

  const status = error.response?.status;
  const data = error.response?.data as any;

  return {
    status,
    code: data?.code, // 서버 ErrorCode
    title: data?.message || '요청 처리 중 오류가 발생했습니다.',
    description: data?.description || '',
  };
}
