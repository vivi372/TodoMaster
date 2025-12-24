import { Navigate, type RouteObject, useRoutes } from 'react-router-dom';

import LoginPage from '@/pages/login/LoginPage'; // 로그인 페이지 컴포넌트
import SignupPage from '@/pages/signup/SignupPage'; // 회원가입 페이지 컴포넌트
import TodoPage from '@/pages/todos/TodoPage'; // Todo 목록 페이지 컴포넌트

import { authStore } from '@/features/auth/store/authStore';
import { GuestGuard } from './guards/GuestGuard';
import { AuthGuard } from './guards/AuthGuard';
import SocialRedirectPage from '@/pages/socialRedirect/SocialRedirectPage';
import TermsPage from '@/pages/terms/TermsPage';
import PrivacyPage from '@/pages/privacy/PrivacyPage';
import VerifyPage from '@/pages/verify/VerifyPage';

/**
 * RootRedirect 컴포넌트:
 * 애플리케이션의 루트 경로('/')에 접근했을 때, 인증 상태에 따라 경로를 분기합니다.
 */
function RootRedirect() {
  // 전역 상태에서 Access Token 존재 여부로 인증 상태를 확인합니다.
  const isAuthenticated = authStore((s) => !!s.isAuthenticated);

  // 인증 상태에 따라 /todos 또는 /login으로 리디렉션합니다.
  return (
    <Navigate
      to={isAuthenticated ? '/todos' : '/login'} // 로그인 상태: /todos로, 비로그인 상태: /login으로
      replace // 현재 히스토리를 대체하여 뒤로 가기를 막습니다.
    />
  );
}

/**
 * routes 배열: 애플리케이션의 모든 라우팅 규칙을 정의하는 객체 배열 (RouteObject 타입)
 */
const routes: RouteObject[] = [
  {
    path: '/',
    // 루트 경로에 접근 시, 인증 상태에 따른 리디렉션 로직을 실행합니다.
    element: <RootRedirect />,
  },
  {
    path: '/login',
    element: (
      // GuestGuard: 이미 로그인 상태라면 이 페이지 대신 /todos로 리디렉션합니다.
      <GuestGuard>
        <LoginPage />
      </GuestGuard>
    ),
  },
  {
    path: '/signup',
    element: (
      // GuestGuard: 이미 로그인 상태라면 이 페이지 대신 /todos로 리디렉션합니다.
      <GuestGuard>
        <SignupPage />
      </GuestGuard>
    ),
  },
  {
    path: '/terms',
    element: <TermsPage />,
  },
  {
    path: '/privacy',
    element: <PrivacyPage />,
  },
  {
    path: '/verify',
    element: <VerifyPage />,
  },
  {
    path: '/auth/:provider/callback',
    element: (
      // GuestGuard: 이미 로그인 상태라면 이 페이지 대신 /todos로 리디렉션합니다.
      <GuestGuard>
        <SocialRedirectPage />
      </GuestGuard>
    ),
  },
  {
    path: '/todos',
    element: (
      // AuthGuard: 비로그인 상태라면 이 페이지 대신 /login으로 리디렉션합니다.
      // 로그인 사용자만 TodoPage에 접근 가능합니다.
      <AuthGuard>
        <TodoPage />
      </AuthGuard>
    ),
  },
  {
    // path: '*',
    // 위에 정의된 경로 외의 모든 경로(404)에 접근 시 처리
    path: '*',
    // 루트 경로('/')로 리디렉션하여 RootRedirect 로직을 다시 태웁니다.
    element: <Navigate to="/" replace />,
  },
];

/**
 * AppRoutes 함수:
 * useRoutes 훅을 사용하여 위에 정의된 라우트 객체 배열을 실제 라우팅 컴포넌트로 변환합니다.
 * 이 함수는 <BrowserRouter> 컴포넌트 하위에서 한 번만 호출되어야 합니다.
 */
export default function AppRoutes() {
  return useRoutes(routes);
}
