import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="비밀번호 찾기" subtitle="가입하신 이메일로 비밀번호를 재설정하세요">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
