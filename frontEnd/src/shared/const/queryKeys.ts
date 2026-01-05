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
export const QUERY_KEYS = {
  /**
   * @description 사용자 정보 관련 쿼리 키
   */
  USER_PROFILE: 'myProfile',
  USER_SUMMARY_PROFILE: 'headerProfile',

  /**
   * @description Todo 관련 쿼리 키
   */
  todos: 'todos', // Todo 목록
  todo: 'todo', // Todo 상세 정보
};
