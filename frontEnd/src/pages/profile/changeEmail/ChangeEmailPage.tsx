// --- 1. Imports ---
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useForm, FormProvider, useFormContext, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Lock,
  CheckCircle2,
  Send,
  Clock,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

// --- Project Files ---
import { appToast } from '@/shared/utils/appToast';
import useTimer from '@/shared/hooks/useTimer';
import { useRequestEmailVerification } from '@/features/user/hooks/useRequestEmailVerification';
import { useResendVerificationCode } from '@/features/user/hooks/useResendVerificationCode';
import { useExecuteEmailChange } from '@/features/user/hooks/useExecuteEmailChange';

// --- UI Components ---
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { parseAxiosError } from '@/shared/api/parseAxiosError';

// --- Form Schemas ---
const requestSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
});
const verifySchema = z.object({
  verificationCode: z.string().length(6, '인증 코드는 6자리여야 합니다.'),
});

type RequestFormValues = z.infer<typeof requestSchema>;
type VerifyFormValues = z.infer<typeof verifySchema>;

// --- Main Component ---
export default function ChangeEmailPage() {
  // --- 1. State Management ---
  const [step, setStep] = useState<'verify' | 'code'>('verify');
  const [resendCount, setResendCount] = useState(0);
  const [verificationErrorCount, setVerificationErrorCount] = useState(0);

  // 2. 최대 오류 횟수 도달 여부 계산 (새로운 상태 없이 기존 상태 활용)
  const MAX_ERROR_ATTEMPTS = 5;
  const isMaxErrorReached = verificationErrorCount >= MAX_ERROR_ATTEMPTS;

  const {
    isCounting: isResendCooldown,
    remainingTime: resendCooldown,
    startTimer: startResendCooldownTimer,
    stopTimer: stopResendCooldownTimer,
  } = useTimer({ cooldownSeconds: 20 });

  // 60초 재전송 제한 타이머 추가
  const { startTimer: startResendLimitTimer, isCounting: isResendLimitActive } = useTimer({
    cooldownSeconds: 60,
    onTimerEnd: () => {
      setResendCount(0);
      appToast.info({ message: '이제 다시 인증 코드를 재전송할 수 있습니다.' });
    },
  });

  // resendCount가 1이 될 때 60초 타이머 시작
  useEffect(() => {
    if (resendCount === 1 && !isResendLimitActive) {
      startResendLimitTimer();
    }
  }, [resendCount, isResendLimitActive, startResendLimitTimer]);

  // --- 2. Form Management (react-hook-form) ---
  const requestForm = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    mode: 'onBlur',
  });
  const verifyForm = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    mode: 'onBlur',
  });

  const { watch, handleSubmit: handleRequestSubmit } = requestForm;
  const { handleSubmit: handleVerifySubmit } = verifyForm;
  const newEmail = watch('email');

  // --- 3. Verification Code Expiration Timer ---
  const [verificationTime, setVerificationTime] = useState(300);
  const [isVerificationTimerRunning, setIsVerificationTimerRunning] = useState(false);
  const verificationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isVerificationTimerRunning && verificationTime > 0) {
      verificationTimerRef.current = setInterval(() => {
        setVerificationTime((prev) => prev - 1);
      }, 1000);
    } else if (verificationTime === 0 && isVerificationTimerRunning) {
      setIsVerificationTimerRunning(false);
      if (verificationTimerRef.current) clearInterval(verificationTimerRef.current);
      appToast.warning({ message: '인증 코드가 만료되었습니다. 재전송해주세요.' });
    }
    return () => {
      if (verificationTimerRef.current) clearInterval(verificationTimerRef.current);
    };
  }, [isVerificationTimerRunning, verificationTime]);

  // --- 4. API Mutations ---
  const { mutateAsync: requestVerification, isPending: isRequesting } = useRequestEmailVerification(
    () => {
      appToast.success({ message: '인증 코드가 새 이메일로 전송되었습니다!' });
      setStep('code');
      setVerificationTime(300);
      setIsVerificationTimerRunning(true);
      startResendCooldownTimer();
      setResendCount(1);
    },
  );

  const { mutate: resendCode, isPending: isResending } = useResendVerificationCode(() => {
    appToast.success({ message: '인증 코드가 재전송되었습니다!' });
    setVerificationTime(300);
    setIsVerificationTimerRunning(true);
    startResendCooldownTimer();
    setResendCount((prev) => prev + 1);
    verifyForm.setValue('verificationCode', '');
    setVerificationErrorCount(0); // 재전송 성공 시 에러 카운트 초기화
  });

  const { mutate: executeChange, isPending: isExecuting } = useExecuteEmailChange({
    onError: (error) => {
      const appError = parseAxiosError(error);
      // Axios 에러이고, 응답 데이터가 있는지 확인
      if (appError && typeof appError === 'object' && 'code' in appError && appError.code) {
        console.log(typeof appError === 'object');
        const errorCode = appError.code;
        // 5회 실패 에러 코드인지 확인 (백엔드에서 내려준 에러 코드 사용)
        if (errorCode === 'VERIFICATION_CODE_FAILURE_LIMIT') {
          // setVerificationErrorCount(0);
          setResendCount(0);
          stopResendCooldownTimer();
          setVerificationErrorCount((prev) => prev + 1);
          // 선택: 첫 단계로 돌려보낼 수도 있음
          // setStep('verify');
        } else {
          setVerificationErrorCount((prev) => prev + 1);
        }
      } else {
        // 일반적인 에러 처리
        setVerificationErrorCount((prev) => prev + 1);
      }
    },
  });

  // --- 5. Event Handlers ---
  const onFormError = (errors: any) => {
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
      const errorMessage = errors[firstErrorKey].message;
      appToast.error({ message: errorMessage as string });
    }
  };

  const onRequestSubmit: SubmitHandler<RequestFormValues> = async (data) => {
    await requestVerification(data);
  };

  const onVerifySubmit: SubmitHandler<VerifyFormValues> = (data) => {
    if (verificationTime === 0) {
      appToast.error({ message: '인증 코드를 재전송해주세요.' });
      return;
    }
    executeChange({ newEmail: newEmail, verificationCode: data.verificationCode });
  };

  const handleResend = () => {
    if (isResendCooldown || resendCount >= 3 || isResending) return;
    resendCode({ email: newEmail });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader />
      <ProgressTracker step={step} />

      <FormProvider {...requestForm}>
        <form
          onSubmit={handleRequestSubmit(onRequestSubmit, onFormError)}
          style={{ display: step === 'verify' ? 'block' : 'none' }}
          autoComplete="off"
          noValidate
        >
          <RequestForm isSubmitting={isRequesting} />
        </form>
      </FormProvider>

      <FormProvider {...verifyForm}>
        <form
          onSubmit={handleVerifySubmit(onVerifySubmit, onFormError)}
          style={{ display: step === 'code' ? 'block' : 'none' }}
        >
          <VerifyForm
            isSubmitting={isExecuting}
            isResending={isResending}
            newEmail={newEmail}
            timeRemaining={verificationTime}
            isTimerRunning={isVerificationTimerRunning}
            resendCooldown={resendCooldown}
            isResendCooldown={isResendCooldown}
            resendCount={resendCount}
            onResend={handleResend}
            onGoBack={() => setStep('verify')}
            formatTime={formatTime}
            verificationErrorCount={verificationErrorCount}
            isMaxErrorReached={isMaxErrorReached}
          />
        </form>
      </FormProvider>
    </div>
  );
}

// --- Sub-components ---

const PageHeader = () => (
  <div className="flex items-center gap-4">
    <Button variant="ghost" size="icon" asChild>
      <Link to="/profile">
        <ArrowLeft className="w-5 h-5" />
      </Link>
    </Button>
    <div>
      <h1 className="text-2xl font-bold">이메일 변경</h1>
      <p className="text-muted-foreground">보안을 위해 본인 확인이 필요합니다</p>
    </div>
  </div>
);

const ProgressTracker = ({ step }: { step: 'verify' | 'code' }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between relative">
      <div className="absolute top-5 left-0 right-0 h-1 bg-muted -z-10">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: '0%' }}
          animate={{ width: step === 'verify' ? '0%' : '100%' }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <ProgressStep icon={step === 'verify' ? Lock : CheckCircle2} label="비밀번호 확인" isActive />
      <ProgressStep icon={Mail} label="이메일 인증" isActive={step === 'code'} />
    </div>
  </Card>
);

const ProgressStep = ({
  icon: Icon,
  label,
  isActive,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
    >
      <Icon className="w-5 h-5" />
    </div>
    <span className={`font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
      {label}
    </span>
  </div>
);

const RequestForm = ({ isSubmitting }: { isSubmitting: boolean }) => {
  const { register } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card className="p-6 space-y-6">
      {/* 1. 유령 비밀번호 필드: 브라우저가 여기에 자동 채움을 시도하게 유도 */}
      <input
        type="password"
        autoComplete="new-password"
        style={{ display: 'none', opacity: 0, position: 'absolute' }}
      />
      <div>
        <h2 className="text-xl font-bold mb-2">비밀번호 확인</h2>
        <p className="text-sm text-muted-foreground">
          현재 비밀번호와 변경할 새 이메일 주소를 입력하세요
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">
            현재 비밀번호 <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="currentPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="현재 비밀번호를 입력하세요"
              className="pl-10 pr-12"
              autoComplete="false"
              {...register('currentPassword')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="newEmail">
            새 이메일 <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="newEmail"
              type="email"
              placeholder="새 이메일 주소를 입력하세요"
              className="pl-10"
              {...register('email')}
              autoComplete="off"
            />
          </div>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>안내:</strong> 새 이메일로 인증 코드가 전송됩니다. 인증 코드를 입력하여 이메일
          변경을 완료하세요.
        </p>
      </div>
      <div className="flex gap-3">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          <Send className="w-4 h-4 mr-2" />
          {isSubmitting ? '전송 중...' : '인증 코드 받기'}
        </Button>
        <Button type="button" variant="outline" asChild className="flex-1 bg-transparent">
          <Link to="/profile">취소</Link>
        </Button>
      </div>
    </Card>
  );
};

const VerifyForm = (props: any) => {
  const {
    isSubmitting,
    isResending,
    newEmail,
    timeRemaining,
    isTimerRunning,
    resendCooldown,
    isResendCooldown,
    resendCount,
    onResend,
    onGoBack,
    formatTime,
    verificationErrorCount,
    isMaxErrorReached,
  } = props;
  const { register } = useFormContext();

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">이메일 인증</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-primary">{newEmail}</span>로 전송된 인증 코드를
          입력하세요
        </p>
      </div>
      <TimerDisplay timeRemaining={timeRemaining} formatTime={formatTime} />
      {verificationErrorCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              인증 실패 {verificationErrorCount}/5회
            </p>
            {isMaxErrorReached ? (
              <p className="text-xs text-red-600">
                인증 코드 오류 횟수를 초과했습니다. 다시 시도하려면 페이지를 새로고침 하거나
                재전송을 시도해 주세요.
              </p>
            ) : (
              <p className="text-xs text-red-600">5회 실패 시 인증 코드를 재전송해야 합니다</p>
            )}
          </div>
        </motion.div>
      )}
      <div className="space-y-2">
        <Label htmlFor="verificationCode">
          인증 코드 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="verificationCode"
          placeholder="6자리 인증 코드"
          maxLength={6}
          className="text-center text-2xl tracking-widest font-mono"
          disabled={!isTimerRunning || isSubmitting || isMaxErrorReached}
          {...register('verificationCode')}
        />
      </div>
      <ResendButton
        onResend={onResend}
        resendCooldown={resendCooldown}
        isResendCooldown={isResendCooldown}
        resendCount={resendCount}
        isResending={isResending}
      />
      <div className="flex gap-3">
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting || !isTimerRunning || isMaxErrorReached}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {isSubmitting ? '확인 중...' : '인증 완료'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onGoBack}
          className="flex-1 bg-transparent"
        >
          이전으로
        </Button>
      </div>
    </Card>
  );
};

const TimerDisplay = ({
  timeRemaining,
  formatTime,
}: {
  timeRemaining: number;
  formatTime: (t: number) => string;
}) => {
  const isExpired = timeRemaining === 0;
  const timeColorClass = timeRemaining > 60 ? 'green' : timeRemaining > 0 ? 'yellow' : 'red';

  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg bg-${timeColorClass}-50 border border-${timeColorClass}-200`}
    >
      <Clock className={`w-5 h-5 text-${timeColorClass}-600`} />
      <p className={`text-sm font-medium text-${timeColorClass}-800`}>
        {isExpired ? '인증 코드가 만료되었습니다' : `남은 시간: ${formatTime(timeRemaining)}`}
      </p>
    </div>
  );
};

const ResendButton = (props: any) => {
  const { onResend, resendCooldown, isResendCooldown, resendCount, isResending } = props;
  return (
    <div className="text-center space-y-2">
      <p className="text-sm text-muted-foreground">인증 코드를 받지 못하셨나요?</p>
      <Button
        type="button"
        variant="outline"
        className="w-full bg-primary/10 border-primary/30 hover:bg-primary/20 font-medium"
        onClick={onResend}
        disabled={isResendCooldown || resendCount >= 3 || isResending}
      >
        <Send className="w-4 h-4 mr-2" />
        인증 코드 재전송
        {isResendCooldown && ` (${resendCooldown}초 대기)`}
      </Button>
      <p className="text-xs text-muted-foreground">재전송 {resendCount}/3회 (1분당 3회 제한)</p>
    </div>
  );
};
