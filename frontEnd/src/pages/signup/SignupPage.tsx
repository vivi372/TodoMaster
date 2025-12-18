import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { SignupForm } from '@/features/auth/components/SignupForm';

export default function SignupPage() {
  return (
    <AuthLayout title="환영합니다!" subtitle="간단한 가입으로 시작해보세요">
      <SignupForm />
    </AuthLayout>
  );
}
