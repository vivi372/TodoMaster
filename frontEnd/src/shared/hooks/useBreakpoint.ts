import { useEffect, useState } from 'react';

/**
 * 브라우저 뷰포트 너비가 768px 이하인지 실시간으로 감지하여 반환합니다.
 * 모바일(Mobile)과 태블릿/데스크톱(Desktop)을 구분하는 반응형 로직에 사용됩니다.
 * * @returns {boolean} 뷰포트 너비가 768px 이하면 true, 아니면 false를 반환합니다.
 */
export function useIsMobile(): boolean {
  // 1. 상태 초기화
  // 컴포넌트 마운트 시점에 window.matchMedia를 사용하여 현재 뷰포트 상태(768px 이하 여부)를 초기값으로 설정합니다.
  const [isMobile, setIsMobile] = useState(window.matchMedia('(max-width: 768px)').matches);

  useEffect(() => {
    // 2. 미디어 쿼리 객체 생성
    // 768px 이하를 감지하는 Media Query List 객체를 생성합니다.
    const media = window.matchMedia('(max-width: 768px)');

    // 3. 리스너 함수 정의
    // 뷰포트 크기가 변경될 때(matchmedia의 상태가 true/false로 바뀔 때) 호출될 함수입니다.
    const listener = () => setIsMobile(media.matches);

    // 4. 이벤트 리스너 등록
    // media.addEventListener를 사용하여 미디어 쿼리 상태 변화(change)를 감지하고,
    // 상태가 변할 때마다 listener 함수를 호출하여 isMobile 상태를 업데이트합니다.
    media.addEventListener('change', listener);

    // 5. 클린업(Clean-up) 함수 반환
    // 컴포넌트가 언마운트되거나 useEffect가 다시 실행되기 직전에
    // 이전에 등록했던 이벤트 리스너를 제거하여 메모리 누수를 방지합니다.
    return () => media.removeEventListener('change', listener);
  }, []); // 의존성 배열이 빈 배열이므로, 컴포넌트 마운트 시 단 한 번만 실행됩니다.

  // 6. 현재 모바일 상태(boolean) 반환
  return isMobile;
}
