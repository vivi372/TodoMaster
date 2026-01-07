import {
  useMutation,
  useQueryClient,
  type UseMutateAsyncFunction,
  type UseMutateFunction,
} from '@tanstack/react-query';
import { authStore } from '../store/authStore';
import { authApi } from '../api/authApi';
import type {
  AccountActivationRequest,
  LoginResponse,
  LoginRequest,
  PasswordResetRequest,
  ResendRequest,
  SocialLoginRequest,
} from '../types/authTypes';
import { authQueryKeys, userQueryKeys } from '@/shared/const/queryKeys';

// 훅의 반환 타입을 정의합니다.
export interface UseAuthResult {
  login: UseMutateFunction<LoginResponse, Error, LoginRequest, unknown>;
  socialLogin: UseMutateAsyncFunction<LoginResponse, Error, SocialLoginRequest, unknown>;
  logout: UseMutateAsyncFunction<void, Error, void, unknown>;
  resend: UseMutateAsyncFunction<void, Error, ResendRequest, unknown>;
  accountActivation: UseMutateAsyncFunction<void, Error, AccountActivationRequest, unknown>;
  passwordForgot: UseMutateAsyncFunction<void, Error, ResendRequest, unknown>;
  validateResetToken: UseMutateAsyncFunction<void, Error, string | undefined, unknown>;
  passwordReset: UseMutateAsyncFunction<void, Error, PasswordResetRequest, unknown>;
  isLoading: boolean;
}

/**
 * useAuth 커스텀 훅:
 * 일반 로그인 및 소셜 로그인 비동기 요청을 처리하고,
 * 성공 시 Access Token을 전역 상태 스토어에 저장하는 로직을 통합합니다.
 */
export const useAuth = (): UseAuthResult => {
  // 1. Zustand 스토어에서 Access Token을 저장하는 액션과 로그아웃 액션 가져오기
  const setLogin = authStore.getState().setLogin;
  const logout = authStore.getState().logout;

  const queryClient = useQueryClient();

  // 일반 로그인 Mutation 정의
  const loginMutation = useMutation({
    // 실제 서버 요청을 담당하는 함수 (payload를 인자로 받음)
    mutationFn: authApi.login,

    // 요청이 성공했을 때 실행되는 콜백
    onSuccess: (data) => {
      // 서버 응답 데이터(data)를 Zustand 스토어에 저장하여 전역 상태를 업데이트합니다.
      setLogin(data);
    },
  });

  // 소셜 로그인 Mutation 정의
  const socialLoginMutation = useMutation({
    // mutationFn: useMutation의 mutate가 호출될 때 전달된 인자를 받아,
    // authApi.socialLogin 함수에 맞는 형태로 가공하여 호출합니다.
    mutationFn: authApi.socialLogin,

    // 소셜 로그인 성공 시에도 동일하게 Access Token을 저장합니다.
    onSuccess: (data) => {
      setLogin(data);
    },
  });

  // 로그아웃 Mutation 정의
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,

    onSuccess: () => {
      // 성공 후 auth에 있는 토큰 삭제 및 인증 여부 상태 변경
      logout();

      // 사용자 관련 캐시 제거
      queryClient.removeQueries({ queryKey: authQueryKeys.profile() });
      queryClient.removeQueries({ queryKey: userQueryKeys.summary() });
    },
  });

  // 인증 이메일 재전송 Mutation 정의
  const resendVerificationEmailMutation = useMutation({
    // 실제 서버 요청을 담당하는 함수 (payload를 인자로 받음)
    mutationFn: authApi.resendVerificationEmail,
  });

  // 계정 활성화 Mutation 정의
  const accountActivationMutation = useMutation({
    // 실제 서버 요청을 담당하는 함수 (payload를 인자로 받음)
    mutationFn: authApi.accountActivation,
  });

  // 비밀번호 찾기 Mutation 정의
  const passwordForgotMutation = useMutation({
    // 실제 서버 요청을 담당하는 함수 (payload를 인자로 받음)
    mutationFn: authApi.passwordForgot,
  });

  // 비밀번호 리셋 토큰 검증 Mutation 정의
  const validateResetTokenMutation = useMutation({
    // 실제 서버 요청을 담당하는 함수 (resetToken를 인자로 받음)
    mutationFn: authApi.validateResetToken,
  });

  // 비밀번호 재설정 Mutation 정의
  const passwordResetMutation = useMutation({
    // 실제 서버 요청을 담당하는 함수 (payload를 인자로 받음)
    mutationFn: authApi.passwordReset,
  });

  // 4. 컴포넌트에서 사용할 기능과 상태를 반환합니다.
  return {
    // mutate 함수를 login이라는 이름으로 반환하여 컴포넌트에서 쉽게 호출할 수 있게 합니다.
    login: loginMutation.mutate,

    // 소셜 로그인 mutateAsync 함수를 반환합니다.
    socialLogin: socialLoginMutation.mutateAsync,

    // 소셜 로그인 mutateAsync 함수를 반환합니다.
    logout: logoutMutation.mutateAsync,

    // 인증 이메일 재전송 mutateAsync 함수를 반환합니다
    resend: resendVerificationEmailMutation.mutateAsync,

    // 계정 활성화 mutateAsync 함수를 반환합니다
    accountActivation: accountActivationMutation.mutateAsync,

    //  비밀번호 찾기 mutateAsync 함수를 반환합니다
    passwordForgot: passwordForgotMutation.mutateAsync,

    //  비밀번호 리셋 토큰 검증 mutateAsync 함수를 반환합니다
    validateResetToken: validateResetTokenMutation.mutateAsync,

    //  비밀번호 재설정 mutateAsync 함수를 반환합니다
    passwordReset: passwordResetMutation.mutateAsync,

    // 요청 중 하나라도 진행 중이면 true를 반환하는 통합 로딩 상태
    isLoading:
      loginMutation.isPending || // 일반 로그인 로딩 상태
      socialLoginMutation.isPending ||
      resendVerificationEmailMutation.isPending ||
      accountActivationMutation.isPending ||
      passwordForgotMutation.isPending ||
      passwordResetMutation.isPending ||
      validateResetTokenMutation.isPending ||
      logoutMutation.isPending,
  };
};
