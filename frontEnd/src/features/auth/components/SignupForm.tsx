import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Checkbox } from '@/shared/ui/checkbox';
import { Button } from '@/shared/ui/button';
import { motion } from 'framer-motion';
import { signupSchema, type signupSchemaValues } from '../schema/signupSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { appToast } from '@/shared/utils/appToast';
import GoogleIcon from '@/shared/ui/GoogleIcon';
import KakaoIcon from '@/shared/ui/KakaoIcon';
import { ProfileImageUpload } from './ProfileImageUpload';
import { useSignup } from '../hooks/useSignup';
import { useModal } from '@/shared/store/modalStore';
import { useAuth } from '../hooks/useAuth';
import useTimer from '@/shared/hooks/useTimer';

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

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  // 회원가입이 성공적으로 완료되었지만 아직 인증이 안 된 상태
  const [isSignedUp, setIsSignedUp] = useState(false);
  // 커스텀 훅에서 서버 요청 함수와 상태 가져오기
  const { signup, isLoading } = useSignup();
  const { resend, resendIsLoading } = useAuth();
  // 커스텀 타이머 훅 사용
  const { isCounting, startTimer, timerText } = useTimer();
  // 커스텀 훅에서 모달 alert 관련 함수 가져오기
  const { alert } = useModal();

  // useForm 훅을 사용하여 폼 상태 및 메서드 초기화
  const {
    control,
    // 폼 필드를 등록하고 유효성 검사 규칙을 연결하는 함수
    register,
    // 폼 제출 이벤트를 가로채서 유효성 검사 후 onSubmit 콜백을 호출하는 래퍼 함수
    handleSubmit,
    // 필드 실시간 관측을 위한 함수
    watch,
    formState: { errors, isSubmitted }, // 검증시 경고 출력을 위해 가져오기
  } = useForm<signupSchemaValues>({
    // Zod 스키마를 사용하여 유효성 검사 규칙을 결정하는 리졸버 설정
    resolver: zodResolver(signupSchema),
    // 검증 시기를 onChange로 설정
    mode: 'onChange',
    // 폼 필드의 기본값 설정
    defaultValues: {
      nickname: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // RHF의 watch를 사용하여 'password' , 'confirmPassword', 'email' 필드의 값을 실시간으로 관찰합니다.
  const watchedPassword = watch('password');
  const watchedConfirmPassword = watch('confirmPassword');
  const watchedEmail = watch('email');

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
  const onSubmit = async (values: signupSchemaValues) => {
    // 폼 유효성 검사가 성공하면, 'values' 객체에 폼 데이터가 담겨 전달됩니다.
    //console.log(values);

    // 1. 실제 서버로 회원가입 요청
    await signup(values);

    // 2. 서버 요청 성공 시 상태 변경
    setIsSignedUp(true); // ⬅️ 성공 시 폼 상태를 변경하여 필드 비활성화 및 버튼 변경 트리거

    // 3. alert 모달 출력
    const descriptionNode: React.ReactNode = (
      <>
        회원님 계정 활성화를 위해 {values.email}로 인증 메일을 발송했습니다. 메일함을 확인하여 인증
        링크를 클릭해주세요.
        <br />
        <br />
        만약 메일이 오지 않는다면, 이 창을 닫은 후 '인증 메일 재전송' 버튼을 눌러주세요.
      </>
    );
    const modalProps = {
      title: '가입 성공! 이메일 인증을 완료해주세요',
      description: descriptionNode,
    };
    alert(modalProps);
  };

  // 인증 메일 재전송 버튼 클릭시 실행되는 함수
  const handleResend = async () => {
    if (isCounting) return; // 쿨타임 중에는 동작 방지

    const payload = {
      email: watchedEmail,
    };

    await resend(payload);

    // 2. API 성공 시 타이머 시작
    startTimer();
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
      {/* 프로필 필드 블록 */}
      <motion.div className="space-y-2 flex justify-center py-4" variants={itemVariants}>
        <Controller
          name="profileImg"
          control={control}
          render={({ field }) => (
            <ProfileImageUpload
              // RHF에서 관리하는 value (File 객체 또는 null)
              value={field.value}
              // RHF의 onChange 함수에 File 객체를 전달
              onChange={field.onChange}
              // RHF의 onBlur 함수 전달
              onBlur={field.onBlur}
              // (선택 사항) 기존 사용자 프로필 URL이 있다면 여기에 전달
              defaultPreview="/images/default-profile.png"
              size="lg"
              disabled={isLoading || isSignedUp}
            />
          )}
        />
      </motion.div>

      {isSignedUp && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-md mb-4 text-sm font-medium text-center"
          variants={itemVariants}
        >
          인증 메일이 발송되었습니다! 이메일 확인 후 아래 버튼을 눌러 재전송할 수 있습니다.
        </motion.div>
      )}

      {/* 이름 필드 블록 */}
      <motion.div className="space-y-2" variants={itemVariants}>
        <Label htmlFor="name" className="text-sm font-medium">
          이름
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="이름을 입력해주세요"
            className="pl-10 h-12 bg-card border-border"
            {...register('nickname')}
            disabled={isLoading || isSignedUp}
          />
        </div>
      </motion.div>

      {/* 이메일 필드 블록 */}
      <motion.div className="space-y-2" variants={itemVariants}>
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
            autoComplete="off"
            disabled={isLoading || isSignedUp}
          />
        </div>
      </motion.div>

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
            disabled={isLoading || isSignedUp}
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
            disabled={isLoading || isSignedUp}
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

      {/* 약관 동의 블록 */}
      <motion.div className="flex items-start gap-2 pt-2" variants={itemVariants}>
        <Checkbox
          id="terms"
          checked={agreeTerms}
          onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
          className="mt-0.5 border-muted-foreground
                data-[state=checked]:bg-primary
                data-[state=checked]:border-primary"
          disabled={isLoading || isSignedUp}
        />
        <Label
          htmlFor="terms"
          className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
        >
          <Link
            to="/terms"
            className="text-foreground font-medium hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            이용약관
          </Link>{' '}
          및{' '}
          <Link
            to="/privacy"
            className="text-foreground font-medium hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            개인정보처리방침
          </Link>
          에 동의합니다
        </Label>
      </motion.div>

      {/* 회원가입 버튼 블록 */}
      <motion.div variants={itemVariants}>
        {isSignedUp ? (
          // 상태 2: 재전송 버튼 (가입 성공 후)
          <Button
            type="button"
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
            disabled={isLoading || isCounting}
            onClick={handleResend}
          >
            {resendIsLoading ? '전송 중...' : `인증 메일 재전송 ${timerText}`}
          </Button>
        ) : (
          // 상태 1: 회원가입 버튼 (기본)
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
            disabled={isLoading || !agreeTerms}
          >
            {isLoading ? '가입 중...' : '회원가입'}
          </Button>
        )}
      </motion.div>

      {/* 구분선 (또는) 블록 */}
      <motion.div className="relative my-6" variants={itemVariants}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-muted-foreground">또는</span>
        </div>
      </motion.div>

      {/* 소셜 로그인 버튼 블록 */}
      <motion.div className="grid grid-cols-2 gap-3" variants={itemVariants}>
        {/* ... (Google 버튼) */}
        <Button type="button" variant="outline" className="h-12 bg-card hover:bg-accent">
          {/* ... (Google SVG) ... */}
          <GoogleIcon size={20} className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">Google로 계정 만들기</span>
          <span className="sm:hidden">Google</span>
        </Button>
        {/* ... Kakao 버튼 ... */}
        <Button
          type="button"
          variant="default"
          className="h-12 !bg-kakao-yellow hover:!bg-[#FEE500]/90 text-black shadow-sm border border-transparent"
        >
          <KakaoIcon size={20} className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">카카오로 로그인</span>
          <span className="sm:hidden">카카오</span>
        </Button>
      </motion.div>

      {/* 로그인 링크 블록 */}
      <motion.p className="text-center text-sm text-muted-foreground mt-6" variants={itemVariants}>
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className="text-foreground font-semibold hover:underline">
          로그인
        </Link>
      </motion.p>
    </motion.form>
  );
}
