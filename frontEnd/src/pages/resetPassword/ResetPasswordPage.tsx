import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useModalStore } from '@/shared/store/modalStore';
import { LoadingDots } from '@/shared/ui/loading/LoadingDots';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ResetPasswordPage() {
  // 커스텀 훅에서 서버 요청 함수와 상태 가져오기
  const { validateResetToken, isLoading } = useAuth();
  const { modalData } = useModalStore();
  // url 쿼리 파라메터 가져오기
  const [params] = useSearchParams();
  const resetToken: string | undefined = params.get('token') ?? undefined;

  const open = !!modalData;

  // 페이지 진입시 토큰 검증
  useEffect(() => {
    validateResetToken(resetToken);
  }, [params]);

  if (open) return <></>;

  if (isLoading && !open) return <LoadingDots fullscreen={true} />;

  return (
    <AuthLayout
      title="새로운 비밀번호를 설정하세요"
      subtitle="계정 보안 강화를 위해 안전한 비밀번호를 입력해주세요."
    >
      <ResetPasswordForm resetToken={resetToken} />
    </AuthLayout>
  );
}
