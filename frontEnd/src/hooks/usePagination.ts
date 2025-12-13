import { useState } from 'react';

/**
 * 페이지네이션 훅의 초기 설정 옵션을 정의하는 TypeScript 인터페이스입니다.
 */
export interface PaginationOptions {
  initialPage?: number; // 시작 페이지 번호 (기본값: 1)
  size?: number; // 한 페이지에 표시할 항목 개수 (기본값: 10)
}

/**
 * 페이지 번호와 페이지당 항목 개수(사이즈)를 관리하고, 페이지 이동 함수를 제공하는 커스텀 훅입니다.
 *
 * @param opts 초기 페이지 번호 및 사이즈 설정 옵션 (선택적)
 * @returns 현재 페이지, 사이즈, 그리고 상태를 변경하는 함수들이 포함된 객체
 */
export const usePagination = (opts?: PaginationOptions) => {
  // 1. 페이지 상태: 초기값은 옵션에서 주어진 initialPage이거나, 없으면 1입니다.
  const [page, setPage] = useState(opts?.initialPage ?? 1);

  // 2. 사이즈 상태: 초기값은 옵션에서 주어진 size이거나, 없으면 10입니다.
  const [size, setSize] = useState(opts?.size ?? 10);

  // 3. 다음 페이지로 이동하는 함수: 현재 페이지에 1을 더합니다.
  const nextPage = () => setPage((p) => p + 1);

  // 4. 이전 페이지로 이동하는 함수: 현재 페이지에서 1을 꿉니다.
  //    페이지가 1보다 작아지지 않도록 Math.max(1, p - 1)로 최소값을 1로 보장합니다.
  const prevPage = () => setPage((p) => Math.max(1, p - 1));

  // 5. 페이지를 1페이지로 초기화하는 함수: 검색 조건 변경 등에 사용됩니다.
  const reset = () => setPage(1);

  // 6. 모든 상태와 상태 변경 함수를 객체로 묶어 반환합니다.
  return {
    page,
    size,
    setPage, // 임의의 페이지 번호로 직접 이동할 때 사용
    setSize, // 페이지 사이즈를 변경할 때 사용
    nextPage,
    prevPage,
    reset,
  };
};
