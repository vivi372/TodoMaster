import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Checkbox } from '@/shared/ui/checkbox';
import { Button } from '@/shared/ui/button';
import GoogleIcon from '@/shared/ui/GoogleIcon';
import KakaoIcon from '@/shared/ui/KakaoIcon';
import { loginSchema, type LoginFormValues } from '../schema/loginSchema';
import { useAuth } from '../hooks/useAuth';
import { appToast } from '@/shared/utils/appToast';

export function LoginForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  // 커스텀 훅에서 서버 요청 함수와 상태 가져오기
  const { login, isLoading } = useAuth();

  // useForm 훅을 사용하여 폼 상태 및 메서드 초기화
  const {
    control,
    // 폼 필드를 등록하고 유효성 검사 규칙을 연결하는 함수
    register,
    // 폼 제출 이벤트를 가로채서 유효성 검사 후 onSubmit 콜백을 호출하는 래퍼 함수
    handleSubmit,
    formState: { errors, isSubmitted }, // 검증시 경고 출력을 위해 가져오기
  } = useForm<LoginFormValues>({
    // Zod 스키마를 사용하여 유효성 검사 규칙을 결정하는 리졸버 설정
    resolver: zodResolver(loginSchema),
    // 검증 시기를 onChange로 설정
    mode: 'onChange',
    // 폼 필드의 기본값 설정
    defaultValues: {
      rememberMe: true, // '로그인 유지' 옵션의 기본값을 true로 설정
    },
  });

  // 검증시 경고 출력을 위한 useEffect
  useEffect(() => {
    // 아직 제출도 안 했는데 토스트 뜨는 것 방지
    if (!isSubmitted) return;

    const firstError = Object.values(errors)[0];
    if (!firstError?.message) return;

    appToast.warning({ message: firstError.message });
  }, [errors, isSubmitted]);

  // 폼 제출 시 실행되는 비동기 함수
  const onSubmit = (values: LoginFormValues) => {
    // 폼 유효성 검사가 성공하면, 'values' 객체에 폼 데이터가 담겨 전달됩니다.
    console.log(values);

    login(values);
    // 로그인 성공 후 '/todos' 경로로 이동 (replace: true는 뒤로 가기 기록에서 현재 페이지를 대체)
    //navigate('/todos', { replace: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          이메일
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="hello@example.com"
            className="pl-10 h-12 bg-card border-border"
            {...register('email')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          비밀번호
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="pl-10 pr-10 h-12 bg-card border-border"
            {...register('password')}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* 외부 UI 컴포넌트 제어를 위해 Controller 사용 */}
          <Controller
            name="rememberMe"
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className="
                    border-muted-foreground
                    data-[state=checked]:bg-primary
                    data-[state=checked]:border-primary
                  "
              />
            )}
          />
          <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
            로그인 유지
          </Label>
        </div>
        <Link
          to="/forgot-password"
          className="text-sm text-primary-foreground/80 hover:text-foreground transition-colors font-medium"
        >
          비밀번호 찾기
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
        disabled={isLoading}
      >
        {isLoading ? '로그인 중...' : '로그인'}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-muted-foreground">또는</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" className="h-12 bg-card hover:bg-accent">
          <GoogleIcon size={20} className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">Google로 로그인</span>
          <span className="sm:hidden">Google</span>
        </Button>
        <Button
          type="button"
          // 기본 variant는 'default'로 두고, 커스텀 클래스로 색상을 완벽히 덮어씌웁니다.
          variant="default" // variant는 유지하되, 아래 className으로 오버라이드
          className="h-12 !bg-kakao-yellow hover:!bg-[#FEE500]/90 text-black shadow-sm border border-transparent"
        >
          {/* 🌟 카카오 아이콘 (필수: 검은색, 텍스트와 분리) */}
          <KakaoIcon size={20} className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">카카오로 로그인</span>
          <span className="sm:hidden">카카오</span>
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        계정이 없으신가요?{' '}
        <Link to="/signup" className="text-foreground font-semibold hover:underline">
          회원가입
        </Link>
      </p>
    </form>
  );
}
