import { useRef, useState, useEffect } from 'react';

/**
 * 특정 값(value)의 변경을 지정된 시간(delay) 간격으로 제한하는 커스텀 훅입니다.
 * 이벤트가 아무리 빈번하게 발생해도 delay 동안 최대 한 번만 값이 업데이트됩니다.
 * 주로 스크롤 이벤트, 마우스 이동 이벤트 등 지속적인 이벤트 발생 시 최적화에 사용됩니다.
 *
 * @param value 쓰로틀링을 적용할 대상 값
 * @param delay 실행 간격을 제한할 시간 (밀리초 단위, 기본값 300ms)
 * @returns 쓰로틀링 처리가 완료된 최종 값
 */
export const useThrottle = <T>(value: T, delay = 300): T => {
  // 1. 내부 상태: 쓰로틀링된 최종 값을 저장합니다. 초기값은 입력받은 value입니다.
  const [throttled, setThrottled] = useState(value);

  // 2. 참조값: 마지막으로 값이 업데이트된 시간을 저장합니다.
  //    useRef를 사용하여 렌더링이 일어나도 값이 초기화되지 않고 유지되도록 합니다.
  const lastExecuted = useRef(Date.now());

  useEffect(() => {
    // 3. 현재 시간 기록
    const now = Date.now();

    // 4. 시간 간격 검사: 마지막 실행 시간과 현재 시간의 차이가 delay보다 크거나 같은지 확인
    if (now - lastExecuted.current >= delay) {
      // 5. 조건 만족 시:
      //    a. 쓰로틀링된 값을 최신 value로 업데이트합니다.
      setThrottled(value);
      //    b. 마지막 실행 시간을 현재 시간으로 갱신합니다.
      lastExecuted.current = now;
    }

    // 이 훅은 디바운스와 달리 clearTimeout을 사용하지 않습니다.
    // 대신, 조건문(if)을 통해 실행 빈도 자체를 제한합니다.
  }, [value, delay]); // value나 delay가 변경될 때마다 이 Effect가 다시 실행됩니다.

  // 6. 쓰로틀링된 값을 반환합니다.
  return throttled;
};
