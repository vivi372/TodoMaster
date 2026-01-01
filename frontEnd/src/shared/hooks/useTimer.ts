import { useState, useEffect, useCallback } from 'react';

/**
 * useTimer 훅의 옵션 인터페이스
 */
interface TimerOptions {
  /** 쿨다운 시간 (초). 기본값은 60초입니다. */
  cooldownSeconds?: number;
  /** 타이머가 0이 되어 종료될 때 실행될 콜백 함수 */
  onTimerEnd?: () => void;
}

/**
 * useTimer 훅의 반환 값 인터페이스
 */
interface TimerHook {
  isCounting: boolean;
  remainingTime: number;
  startTimer: () => void;
  timerText: string;
  stopTimer: () => void;
  COOLDOWN_SECONDS: number;
}

/**
 * 재전송 쿨다운 타이머를 관리하는 훅입니다.
 * @param options - 타이머 설정 옵션 (cooldownSeconds, onTimerEnd)
 * @returns TimerHook
 */
const useTimer = (options: TimerOptions = {}): TimerHook => {
  const { cooldownSeconds = 60, onTimerEnd } = options;

  // 1. 상태 정의
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  const COOLDOWN_SECONDS: number = cooldownSeconds;

  // 2. 타이머 시작 함수: useCallback을 사용하여 함수가 고정되도록 합니다.
  const startTimer = useCallback((): void => {
    setRemainingTime(COOLDOWN_SECONDS);
    setIsCounting(true);
  }, [COOLDOWN_SECONDS]);

  // 3. 타이머 로직 (useEffect)
  useEffect(() => {
    let timerId: number | null = null;

    if (isCounting && remainingTime > 0) {
      // 1초마다 remainingTime을 감소시키는 타이머 설정
      timerId = setInterval(() => {
        setRemainingTime((prevTime) => prevTime - 1);
      }, 1000) as unknown as number; // Node.js 환경과의 호환성을 위해 타입 캐스팅
    } else if (remainingTime === 0 && isCounting) {
      // 카운트 다운이 종료되면

      // 3-1. 상태 초기화
      setIsCounting(false);

      // 3-2. 타이머 정리
      if (timerId !== null) {
        clearInterval(timerId);
      }

      // 3-3. 🚨 콜백 함수 실행 (수정된 핵심 로직)
      if (onTimerEnd) {
        onTimerEnd();
      }
    }

    // 4. 클린업 함수: 컴포넌트 언마운트 시 또는 상태 변경 시 타이머 정리
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [isCounting, remainingTime, onTimerEnd]); // 의존성 배열에 onTimerEnd 추가

  // 5. 타이머 종료 함수
  const stopTimer = useCallback((): void => {
    setIsCounting(false);
    setRemainingTime(0);
  }, []);

  // 6. 타이머 텍스트 계산
  const timerText: string = isCounting
    ? `${remainingTime}s` // 쿨타임 중
    : ''; // 쿨타임 종료

  // 7. 훅 반환 값
  return {
    isCounting,
    remainingTime,
    startTimer,
    stopTimer,
    timerText,
    COOLDOWN_SECONDS,
  };
};

export default useTimer;
