import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { appToast } from '@/shared/utils/appToast';
import { useModal } from '@/shared/store/modalStore';
import { useAuth } from '../hooks/useAuth';
import { ResetPasswordSchema, type ResetPasswordSchemaValues } from '../schema/ResetPasswordSchema';
import { useNavigate } from 'react-router-dom';

// 애니메이션 설정
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function ResetPasswordForm({ resetToken }: { resetToken: string | undefined }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // 커스텀 훅에서 서버 요청 함수와 상태 가져오기
  const { passwordReset, isLoading } = useAuth();
  // 커스텀 훅에서 모달 alert 관련 함수 가져오기
  const { alert } = useModal();
  const navigate = useNavigate();

  // useForm 훅을 사용하여 폼 상태 및 메서드 초기화
  const {
    // 폼 필드를 등록하고 유효성 검사 규칙을 연결하는 함수
    register,
    // 폼 제출 이벤트를 가로채서 유효성 검사 후 onSubmit 콜백을 호출하는 래퍼 함수
    handleSubmit,
    // 필드 실시간 관측을 위한 함수
    watch,
    formState: { errors, isSubmitted }, // 검증시 경고 출력을 위해 가져오기
  } = useForm<ResetPasswordSchemaValues>({
    // Zod 스키마를 사용하여 유효성 검사 규칙을 결정하는 리졸버 설정
    resolver: zodResolver(ResetPasswordSchema),
    // 검증 시기를 onChange로 설정
    mode: 'onChange',
    // 폼 필드의 기본값 설정
    defaultValues: {
      resetToken: resetToken,
      password: '',
      confirmPassword: '',
    },
  });

  // RHF의 watch를 사용하여 'password' , 'confirmPassword', 'email' 필드의 값을 실시간으로 관찰합니다.
  const watchedPassword = watch('password');
  const watchedConfirmPassword = watch('confirmPassword');

  // 비밀번호 요구사항 목록 상태를 useState로 관리합니다.
  const [passwordRequirements, setPasswordRequirements] = useState([
    { label: '8자 이상', met: false },
    { label: '영문 포함', met: false },
    { label: '숫자 포함', met: false },
    { label: '특수문자 포함', met: false },
  ]);

  // 비밀번호 상태가 변할 때마다 요구사항을 체크하고 상태를 업데이트합니다.
  useEffect(() => {
    const newRequirements = [
      { label: '8자 이상', met: watchedPassword.length >= 8 },
      { label: '영문 포함', met: /[a-zA-Z]/.test(watchedPassword) },
      { label: '숫자 포함', met: /[0-9]/.test(watchedPassword) },
      { label: '특수문자 포함', met: /[!@#$%^&*(),.?":{}|<>]/.test(watchedPassword) },
    ];
    setPasswordRequirements(newRequirements);
  }, [watchedPassword]); // 👈 watchedPassword가 변경될 때마다 실행

  // 비밀번호 일치 여부 변수
  const passwordsMatch: boolean =
    watchedPassword == watchedConfirmPassword && watchedConfirmPassword !== '';

  // 검증시 경고 출력을 위한 useEffect
  useEffect(() => {
    // 아직 제출도 안 했는데 토스트 뜨는 것 방지
    if (!isSubmitted) return;

    const firstError = Object.values(errors)[0];
    if (!firstError?.message) return;

    appToast.warning({ message: firstError.message });
  }, [errors, isSubmitted]);

  // 폼 제출 시 실행되는 비동기 함수
  const onSubmit = async (values: ResetPasswordSchemaValues) => {
    // 폼 유효성 검사가 성공하면, 'values' 객체에 폼 데이터가 담겨 전달됩니다.
    console.log(values);

    // 1. 서버로 비밀번호 재설정 요청
    await passwordReset(values);

    // 3. alert 모달 출력
    const modalProps = {
      title: '비밀번호 재설정 완료',
      description:
        '회원님의 비밀번호가 성공적으로 변경되었습니다. 보안 유지를 위해 지금 바로 변경된 비밀번호로 다시 로그인해 주세요.',
      cancelText: '로그인 페이지로 이동',
    };
    await alert(modalProps);

    // 4. 로그인 페이지로 이동
    navigate('/login');
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      // 🟢 최상위 컨테이너 Variants 적용
      variants={containerVariants}
      initial="hidden"
      animate="show"
      noValidate
      autoComplete="off"
    >
      {/* 3. 토큰 필드를 숨김 처리 (hidden) */}
      <input type="hidden" {...register('resetToken')} />
      {/* 비밀번호 필드 및 유효성 검사 블록 */}
      <motion.div className="space-y-2" variants={itemVariants}>
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
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {/* 비밀번호 요구사항 목록에도 애니메이션 적용 가능 */}
        {watchedPassword && (
          <motion.div
            className="grid grid-cols-2 gap-2 mt-2"
            variants={itemVariants} // 같은 variants를 사용하여 부드럽게 나타남
          >
            {/* ... (요구사항 목록) */}
            {passwordRequirements.map((req) => (
              <div
                key={req.label}
                className={`flex items-center gap-1.5 text-xs ${req.met ? 'text-green-600' : 'text-muted-foreground'}`}
              >
                {req.met ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                {req.label}
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* 비밀번호 확인 필드 블록 */}
      <motion.div className="space-y-2" variants={itemVariants}>
        <Label htmlFor="confirmPassword" className="text-sm font-medium">
          비밀번호 확인
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className={`pl-10 pr-10 h-12 bg-card border-border ${
              watchedConfirmPassword && !passwordsMatch ? 'border-destructive' : ''
            }`}
            {...register('confirmPassword')}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {watchedConfirmPassword && !passwordsMatch && (
          <p className="text-xs text-destructive">비밀번호가 일치하지 않습니다</p>
        )}
      </motion.div>

      {/* 회원가입 버튼 블록 */}
      <motion.div variants={itemVariants}>
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
          disabled={isLoading}
        >
          {isLoading ? '재설정 중...' : '비밀번호 재설정'}
        </Button>
      </motion.div>
    </motion.form>
  );
}
