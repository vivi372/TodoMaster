import { Component, type ReactNode } from 'react';
// 전역 토스트 알림을 관리하는 Zustand 스토어를 가져옵니다.
import { useToastStore } from '@/shared/store/toastStore';

/**
 * 컴포넌트가 받을 Props의 타입을 정의합니다.
 */
interface Props {
  children: ReactNode; // 감싸는 하위 React 요소들
}

/**
 * 컴포넌트의 내부 State 타입을 정의합니다.
 */
interface State {
  hasError: boolean; // 오류 발생 여부를 저장하는 상태
}

/**
 * GlobalErrorBoundary:
 * 하위 컴포넌트 트리에서 발생하는 JS 오류를 잡아내고 처리하는 에러 경계(Error Boundary) 컴포넌트입니다.
 * React 16부터는 클래스 컴포넌트만이 이 역할을 수행할 수 있습니다.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  // 1. 초기 상태 설정: 처음에는 오류가 없는 상태로 시작합니다.
  state: State = { hasError: false };

  /**
   * 2. getDerivedStateFromError (필수 정적 메서드)
   * 하위 컴포넌트에서 오류가 발생했을 때 호출되며, 오류 정보를 받아 상태를 업데이트합니다.
   * 이 메서드의 반환 값은 State에 자동으로 병합됩니다.
   */
  static getDerivedStateFromError(): State {
    // 오류가 발생하면 hasError 상태를 true로 변경하여 렌더링 대체 화면을 준비합니다.
    return { hasError: true };
  }

  /**
   * 3. componentDidCatch (필수 인스턴스 메서드)
   * 오류 정보와 오류를 발생시킨 컴포넌트 트리에 대한 정보를 기록하거나 외부 서비스로 전송할 때 사용됩니다.
   * (여기서는 사용자에게 토스트 알림을 띄우는 데 사용됩니다.)
   * @param error 발생한 오류 객체
   */
  componentDidCatch(error: Error) {
    // React Query 설정에서와 마찬가지로, 컴포넌트 바깥에서 Zustand 상태에 접근하여 토스트를 띄웁니다.
    useToastStore.getState().show(
      // 오류 메시지가 있으면 사용하고, 없으면 기본 메시지를 표시합니다.
      error.message || '화면 오류가 발생했습니다.',
      'error', // 오류 유형으로 알림
    );

    // NOTE: 실제 프로덕션 환경에서는 이 위치에서 Sentry나 LogRocket 같은 오류 로깅 서비스로 오류를 전송합니다.
  }

  /**
   * 4. render()
   * 현재 상태(this.state)에 따라 렌더링할 내용을 결정합니다.
   */
  render() {
    // 오류가 발생했을 경우 (hasError가 true일 때)
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center">
          <p>예기치 못한 오류가 발생했습니다.</p>
        </div>
      );
    }

    // 오류가 없을 경우, 감싸고 있는 원래의 하위 컴포넌트들을 그대로 렌더링합니다.
    return this.props.children;
  }
}
