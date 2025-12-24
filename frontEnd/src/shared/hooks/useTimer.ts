import { useState, useEffect, useCallback } from 'react';

// 재전송 쿨타임 (초) 정의
const COOLDOWN_SECONDS: number = 60;

/**
 * useResendTimer 훅의 반환 값 인터페이스
 */
interface TimerHook {
  isCounting: boolean;
  remainingTime: number;
  startTimer: () => void;
  timerText: string;
  COOLDOWN_SECONDS: number;
}

const useTimer = (): TimerHook => {
  // 1. 상태 정의 (number, boolean 타입 명시)
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // 2. 타이머 시작 함수: useCallback을 사용하여 함수가 고정되도록 합니다.
  const startTimer = useCallback((): void => {
    setRemainingTime(COOLDOWN_SECONDS);
    setIsCounting(true);
  }, []);

  // 3. 타이머 로직 (useEffect)
  useEffect(() => {
    let timerId: number | null = null;

    if (isCounting && remainingTime > 0) {
      // 1초마다 remainingTime을 감소시키는 타이머 설정
      timerId = setInterval(() => {
        setRemainingTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (remainingTime === 0 && isCounting) {
      // 카운트 다운이 종료되면 상태 초기화
      setIsCounting(false);
      // timerId가 null이 아닐 때만 clearInterval 호출
      if (timerId !== null) {
        clearInterval(timerId);
      }
    }

    // 4. 클린업 함수: 컴포넌트 언마운트 시 또는 상태 변경 시 타이머 정리
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [isCounting, remainingTime]); // 의존성 배열

  // 5. 타이머 텍스트 계산
  const timerText: string = isCounting
    ? `${remainingTime}s` // 쿨타임 중
    : ''; // 쿨타임 종료

  // 6. 훅 반환 값
  return {
    isCounting,
    remainingTime,
    startTimer,
    timerText,
    COOLDOWN_SECONDS,
  };
};

export default useTimer;
