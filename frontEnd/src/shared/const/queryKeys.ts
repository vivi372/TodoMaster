// src/shared/const/queryKeys.ts

/**
 * @description
 * react-query에서 사용하는 query key를 정의하는 파일입니다.
 *
 * @example
 * // 단순한 쿼리 키
 * const QUERY_KEYS = {
 *   USER: 'user',
 * };
 * // API 주소와 유사한 계층적 구조
 * const QUERY_KEYS = {
 *   USERS: {
 *     all: ['users'],
 *     detail: (id: string) => [...QUERY_KEYS.USERS.all, id],
 *   },
 * };
 */
export const todoQueryKeys = {
  all: ['todos'] as const,
  lists: () => [...todoQueryKeys.all, 'list'] as const,
  list: (filters: string) => [...todoQueryKeys.lists(), { filters }] as const,
  details: () => [...todoQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...todoQueryKeys.details(), id] as const,
};

export const userQueryKeys = {
  all: ['users'] as const,
  details: () => [...userQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...userQueryKeys.details(), id] as const,
  summary: () => [...userQueryKeys.all, 'summary'] as const,
};

export const authQueryKeys = {
  all: ['auth'] as const,
  profile: () => [...authQueryKeys.all, 'profile'] as const,
};

