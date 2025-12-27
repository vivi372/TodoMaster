import { useEffect, useState } from 'react';

/**
 * 특정 값(value)의 변경이 멈춘 후 지정된 시간(delay)이 지났을 때만 최신 값을 반환하는 커스텀 훅입니다.
 * 주로 실시간 검색, 윈도우 리사이즈 이벤트 등 빈번한 상태 변경을 최적화할 때 사용합니다.
 *
 * @param value 디바운싱을 적용할 대상 값 (예: 검색 입력값)
 * @param delay 대기 시간 (밀리초 단위, 기본값 300ms)
 * @returns 디바운싱 처리가 완료된 최종 값
 */
export const useDebounce = <T>(value: T, delay = 300): T => {
  // 1. 내부 상태: 디바운싱된 값을 저장합니다. 초기값은 입력받은 value입니다.
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // 2. 타이머 설정: delay 시간이 흐른 뒤에 내부 상태(debounced)를 입력받은 value로 업데이트합니다.
    const handler = setTimeout(() => {
      setDebounced(value);
    }, delay);

    // 3. 클린업(Cleanup) 함수: 이 부분이 디바운싱의 핵심입니다!
    //    useEffect가 다시 실행되기 직전(즉, value나 delay가 바뀌었을 때)에 이전 타이머를 취소합니다.
    //    덕분에 delay가 지나기 전에 새로운 값이 들어오면 이전 작업은 취소되고 타이머가 초기화됩니다.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // value나 delay가 변경될 때마다 이 Effect가 다시 실행됩니다.

  // 4. 최종적으로 지연된 값을 반환합니다.
  return debounced;
};
