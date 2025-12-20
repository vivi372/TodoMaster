import { Navigate } from 'react-router-dom'; // React Router v6에서 리디렉션에 사용되는 컴포넌트
import { authStore } from '@/features/auth/store/authStore'; // 전역 인증 상태(Zustand 등)를 가져오는 훅
import { LoadingDots } from '@/shared/ui/loading/LoadingDots';

/**
 * GuestGuardProps 인터페이스:
 * GuestGuard 컴포넌트가 감싸는 자식 컴포넌트들을 타입으로 정의합니다.
 */
interface GuestGuardProps {
  children: React.ReactNode; // 가드 내부에 렌더링될 React 요소
}

/**
 * GuestGuard 컴포넌트:
 * 로그인 페이지, 회원가입 페이지 등 '비로그인 사용자'만 접근 가능한 경로를 보호합니다.
 * 이미 로그인 상태라면, 접근을 막고 다른 경로로 리디렉션합니다.
 * * @param {GuestGuardProps} props - children (자식 컴포넌트)
 */
export function GuestGuard({ children }: GuestGuardProps) {
  // useAuthStore 훅을 사용하여 스토어에서 isAuthenticated, isAuthInitialized 상태만 가져옵니다.
  const { isAuthenticated, isAuthInitialized } = authStore();

  if (!isAuthInitialized) {
    return <LoadingDots fullscreen={true} />; // 또는 로딩 스켈레톤
  }

  // 2. 인증 상태 확인 및 처리
  // 이미 로그인 상태(isAuthenticated === true)라면,
  // 목표 경로(예: /todos)로 강제 리디렉션합니다.
  if (isAuthenticated) {
    // <Navigate to="/todos" replace />
    // - to="/todos": 리디렉션할 대상 경로
    // - replace: 현재 히스토리 스택의 항목을 /todos로 교체하여,
    //            사용자가 뒤로 가기 버튼을 눌러도 이 페이지로 돌아올 수 없게 합니다.
    return <Navigate to="/todos" replace />;
  }

  // 3. 비로그인 상태(isAuthenticated === false)라면,
  // 접근이 허용되므로 감싸진 자식 컴포넌트를 정상적으로 렌더링합니다.
  return <>{children}</>;
}
