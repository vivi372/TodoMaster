import { useNavigate } from 'react-router-dom';

// 🟢 1. Action Code 정의 (모든 가능한 액션을 명시적으로 나열)
export type actionCode = 'REDIRECT_TO_LOGIN' | 'RELOAD_PAGE' | 'LOGOUT_AND_REDIRECT';

/**
 * 메시징 정책에 명시된 특정 후속 조치(Action)를 실행하는 훅입니다.
 * 모든 액션 로직을 통합 관리합니다.
 */
export const useMessageActions = () => {
  // 라우팅 액션을 위해 useNavigate 훅 사용
  const navigate = useNavigate();

  // 🟢 2. Action Code와 실제 실행 함수를 매핑하는 객체
  const actions: Record<actionCode, () => void> = {
    // 🔐 로그인 페이지로 이동 (UNAUTHORIZED_USER에 사용)
    REDIRECT_TO_LOGIN: () => {
      // replace: true를 사용하여 뒤로 가기 버튼으로 이전 페이지로 돌아가지 않도록 합니다.
      navigate('/login', { replace: true });
    },

    // 🔄 현재 페이지 새로고침 (데이터 불일치 등 상황에 사용 가능)
    RELOAD_PAGE: () => {
      window.location.reload();
    },

    // 🚪 로그아웃 처리 후 로그인 페이지로 이동 (토큰 문제 발생 시 강제 로그아웃)
    LOGOUT_AND_REDIRECT: () => {
      // TODO: 실제 로그아웃 처리 로직 (로컬 스토리지 클리어, Zustand 스토어 초기화 등)
      console.log('로그아웃 처리 후 로그인 페이지로 이동합니다.');

      // 로그아웃 후 로그인 페이지로 리다이렉션
      navigate('/login', { replace: true });
    },
  };

  /**
   * 🟢 3. 외부에서 호출될 최종 실행 함수
   * @param actionCode 실행할 액션 코드
   */
  const executeAction = (actionCode: string) => {
    // 타입 가드를 통해 유효한 Action Code인지 확인
    const action = actions[actionCode as actionCode];

    if (action) {
      action();
      console.log(`[Error Action] 실행 완료: ${actionCode}`);
    } else {
      console.warn(`[Error Action] 알 수 없는 액션 코드: ${actionCode}`);
    }
  };

  return { executeAction };
};
