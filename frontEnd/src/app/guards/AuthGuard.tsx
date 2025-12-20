import { Navigate } from 'react-router-dom';
import { authStore } from '@/features/auth/store/authStore';
import { LoadingDots } from '@/shared/ui/loading/LoadingDots';

/**
 * AuthGuard 컴포넌트: 인증이 필요한 라우트를 보호하는 역할을 합니다.
 * React Router의 <Route element={<AuthGuard />} /> 형태로 사용됩니다.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  // useAuthStore 훅을 사용하여 스토어에서 isAuthenticated, isAuthInitialized 상태만 가져옵니다.
  const { isAuthenticated, isAuthInitialized } = authStore();

  if (!isAuthInitialized) {
    return <LoadingDots fullscreen={true} />; // 또는 로딩 스켈레톤
  }

  /**
   * 1. 인증되지 않은 경우 (가드 역할)
   * isAuthenticated가 false이면, 지정된 로그인 경로로 리다이렉트합니다.
   */
  if (!isAuthenticated) {
    // <Navigate> 컴포넌트는 즉시 리다이렉션을 수행합니다.
    // replace={true}는 현재 히스토리 스택을 리다이렉트 경로로 대체하여,
    // 로그인 페이지에서 뒤로 가기를 눌러도 보호된 페이지로 돌아가지 않게 합니다.
    return <Navigate to="/login" replace />;
  }

  // 2. 비로그인 상태(isAuthenticated === false)라면,
  // 접근이 허용되므로 감싸진 자식 컴포넌트를 정상적으로 렌더링합니다.
  return <>{children}</>;
}
