import { toast as sonnerToast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import { Info } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { XCircle } from 'lucide-react';

// 토스트 함수가 받을 인자의 타입을 정의
type ToastArgs = {
  message: string; // 토스트의 주 제목 또는 핵심 메시지 (필수)
  description?: string; // 토스트의 보조 설명 (선택 사항)
};

let lastMessage = ''; // 가장 최근에 표시된 메시지를 저장하는 변수

/**
 * 메시지 디듀플리케이션(중복 제거) 함수
 * 짧은 시간 내에 동일한 메시지로 fn 함수가 반복 호출되는 것을 방지합니다.
 * * @param message - 표시하려는 메시지 (중복 체크의 기준이 됨)
 * @param fn - 메시지 중복이 아닐 때 실행할 실제 함수 (예: toast.error)
 */
const dedup = (message: string, fn: () => void) => {
  // 1. 최근 메시지와 현재 메시지가 같으면, 함수 실행을 중단하고 즉시 리턴합니다.
  if (lastMessage === message) return;

  // 2. 메시지가 다르면, lastMessage를 현재 메시지로 업데이트하여 중복을 방지합니다.
  lastMessage = message;

  // 3. 실제 알림 표시 함수(fn)를 실행합니다.
  fn();

  // 4. 일정 시간 후 같은 메시지 다시 허용
  // 3초(3000ms) 후에 lastMessage를 초기화하여, 3초가 지나면 같은 메시지가 다시 표시될 수 있도록 허용합니다.
  setTimeout(() => {
    // 초기화 시점에도 lastMessage가 여전히 현재 message와 같은지 확인합니다.
    // (다른 메시지가 그 사이에 들어오지 않았는지 확인)
    if (lastMessage === message) {
      lastMessage = ''; // lastMessage를 초기화하여 다음 호출을 허용합니다.
    }
  }, 3000); // 3초의 쿨다운 시간 설정
};

// 애플리케이션 전반에서 사용할 사용자 지정 토스트 호출 함수 객체
export const appToast = {
  /**
   * 성공(Success) 타입 토스트 알림을 표시합니다. (녹색)
   * @param {ToastArgs} args - 메시지와 설명을 포함하는 객체
   */
  success: ({ message, description }: ToastArgs) => {
    dedup(message, () =>
      sonnerToast.success(message, {
        description,
        icon: <CheckCircle2 className="h-5 w-5" />,
        className: 'border-l-4 border-l-green-500',
      }),
    );
  },

  /**
   * 정보(Info) 타입 토스트 알림을 표시합니다. (파란색)
   * @param {ToastArgs} args - 메시지와 설명을 포함하는 객체
   */
  info: ({ message, description }: ToastArgs) => {
    dedup(message, () =>
      sonnerToast.info(message, {
        description,
        icon: <Info className="h-5 w-5" />,
        className: 'border-l-4 border-l-blue-500',
      }),
    );
  },

  /**
   * 경고(Warning) 타입 토스트 알림을 표시합니다. (노란색)
   * @param {ToastArgs} args - 메시지와 설명을 포함하는 객체
   */
  warning: ({ message, description }: ToastArgs) => {
    dedup(message, () =>
      sonnerToast.warning(message, {
        description,
        icon: <AlertTriangle className="h-5 w-5" />,
        className: 'border-l-4 border-l-orange-500',
      }),
    );
  },

  /**
   * 오류(Error) 타입 토스트 알림을 표시합니다. (빨간색)
   * @param {ToastArgs} args - 메시지와 설명을 포함하는 객체
   */
  error: ({ message, description }: ToastArgs) => {
    dedup(message, () =>
      sonnerToast.error(message, {
        description,
        icon: <XCircle className="h-5 w-5" />,
        className: 'border-l-4 border-l-red-500',
      }),
    );
  },
};
