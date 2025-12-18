import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout title="다시 만나서 반가워요!" subtitle="오늘도 할 일을 정리해볼까요?">
      <LoginForm />
    </AuthLayout>
  );
}
