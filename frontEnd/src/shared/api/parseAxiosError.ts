import axios from 'axios';
import type { AppError } from '@/shared/error/types';
import type { actionCode } from '../hooks/useMessageActions';

export type AppErrorPolicyMap = {
  title: string;
  description?: string;
  type: 'error' | 'warning' | 'info';
  silent?: boolean;
  displayType?: string;
  action: actionCode;
};

/**
 * AxiosError → AppError 변환 함수
 * React Query / Mutation / Interceptor 전부 이걸 통과시킨다
 */
export function parseAxiosError(error: unknown): AppError {
  console.error(error);
  if (!axios.isAxiosError(error)) {
    return {
      AppErrorPolicyMap: {
        title: '알 수 없는 오류가 발생했습니다.',
        type: 'error',
        action: 'NONE',
      },
    };
  }

  const errorData = error.response?.data?.error as any;

  return {
    code: errorData?.code, // 서버 ErrorCode
    AppErrorPolicyMap: {
      title: errorData.message,
      description: errorData.description,
      type: errorData.type,
      silent: errorData.silent,
      displayType: errorData.displayType,
      action: errorData.action,
    },
  };
}
